import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const initAuth = () => {
    // Si auth no existe (por falta de credenciales), simulamos el estado
    const isFirebaseSetup = auth !== undefined;
    
    // Referencias a UI (se unificó con login-modal en el HTML)
    const loginModal = document.getElementById('login-modal');
    const closeAuthBtn = document.getElementById('close-login-btn');
    
    // No se necesita clonar botones ya que no hay listeners inline duplicados

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');

    // Manejo de Modal
    const openLogin = () => {
        if (loginModal) {
            loginModal.classList.remove('hidden');
            loginModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                loginModal.classList.remove('opacity-0');
                loginModal.classList.add('opacity-100');
                const card = loginModal.querySelector('div');
                if (card) {
                    card.classList.remove('translate-y-4');
                    card.classList.add('translate-y-0');
                }
            }, 10);
        }
    };

    const closeLogin = () => {
        if (loginModal) {
            loginModal.classList.remove('opacity-100');
            loginModal.classList.add('opacity-0');
            const card = loginModal.querySelector('div');
            if (card) {
                card.classList.remove('translate-y-0');
                card.classList.add('translate-y-4');
            }
            document.body.style.overflow = '';
            setTimeout(() => {
                loginModal.classList.add('hidden');
                loginModal.classList.remove('flex');
            }, 300);
        }
    };

    // Event delegation para abrir login/redirigir
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#login-btn, #login-btn-mobile, #trigger-login-modal-btn, .login-trigger, [data-trigger="login"]');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            if (btn.dataset.loggedIn === "true") {
                window.location.href = "mi-cuenta.html";
            } else {
                openLogin();
            }
        }
    });

    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeLogin();
        });
    }

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLogin();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal && !loginModal.classList.contains('hidden')) {
            closeLogin();
        }
    });

    // Exponer closeLogin globalmente para compatibilidad
    window.closeLogin = closeLogin;
    
    // Cambio entre Login y Registro
    showRegisterBtn?.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    
    showLoginBtn?.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Funciones de Firebase
    const updateUIForUser = (user) => {
        const allTriggers = document.querySelectorAll('#login-btn, #login-btn-mobile, #trigger-login-modal-btn, .login-trigger');
        allTriggers.forEach(btn => {
            if(user) {
                btn.dataset.loggedIn = "true";
                if (btn.id === 'login-btn' || btn.id === 'login-btn-mobile') {
                    btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#A3E635" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    `;
                    btn.classList.add('bg-white/20');
                } else if (btn.id === 'trigger-login-modal-btn') {
                    btn.textContent = "Ver Mi Cuenta";
                }
            } else {
                btn.dataset.loggedIn = "false";
                if (btn.id === 'login-btn' || btn.id === 'login-btn-mobile') {
                    btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M17 8l4 4m0-4l-4 4"></path>
                        </svg>
                    `;
                    btn.classList.remove('bg-white/20');
                } else if (btn.id === 'trigger-login-modal-btn') {
                    btn.textContent = "Iniciar Sesión / Registrarse";
                }
            }
        });

        // Mostrar u ocultar enlace "Mi Cuenta" en el navbar
        const miCuentaNavs = [document.getElementById('nav-mi-cuenta'), document.getElementById('nav-mi-cuenta-mobile')];
        miCuentaNavs.forEach(nav => {
            if (nav) {
                if (user) {
                    nav.classList.remove('hidden');
                } else {
                    nav.classList.add('hidden');
                }
            }
        });

        // Despachar evento personalizado para sincronizar estado en la misma pestaña
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: user }));
    };

    if(isFirebaseSetup) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Si está logueado en Firebase Auth, recuperamos de Firestore o creamos datos
                console.log("Logueado como:", user.email);
                const localUser = localStorage.getItem('dummy_user');
                if (localUser) {
                    updateUIForUser(JSON.parse(localUser));
                } else {
                    // Si no tiene datos locales, los jalamos de la DB
                    if (db) {
                        getDoc(doc(db, "users", user.uid)).then((docSnap) => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data();
                                localStorage.setItem('dummy_user', JSON.stringify(userData));
                                updateUIForUser(userData);
                            } else {
                                const dummy = { email: user.email, uid: user.uid };
                                localStorage.setItem('dummy_user', JSON.stringify(dummy));
                                updateUIForUser(dummy);
                            }
                        }).catch(() => {
                            const dummy = { email: user.email, uid: user.uid };
                            localStorage.setItem('dummy_user', JSON.stringify(dummy));
                            updateUIForUser(dummy);
                        });
                    } else {
                        const dummy = { email: user.email, uid: user.uid };
                        localStorage.setItem('dummy_user', JSON.stringify(dummy));
                        updateUIForUser(dummy);
                    }
                }
            } else {
                // Si no hay sesión en Firebase Auth, verificar localStorage por si inició sesión mediante la base de datos
                const localUser = localStorage.getItem('dummy_user');
                if (localUser) {
                    updateUIForUser(JSON.parse(localUser));
                } else {
                    updateUIForUser(null);
                }
            }
        });

        // Registro
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const username = document.getElementById('reg-username').value;
            const dni = document.getElementById('reg-dni').value;
            const phone = document.getElementById('reg-phone').value;
            const address = document.getElementById('reg-address').value;
            const province = document.getElementById('reg-province').value;
            const city = document.getElementById('reg-city').value;
            const zip = document.getElementById('reg-zip').value;
            
            try {
                let uid = null;
                try {
                    // 1. Intentar registrar en Firebase Auth
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    uid = userCredential.user.uid;
                } catch (authError) {
                    console.warn("Auth de Firebase falló o no está activado, registrando directamente en Firestore:", authError);
                    // Si el proveedor está deshabilitado en Auth, generamos un ID aleatorio para registrar en Firestore
                    uid = "db_user_" + Math.random().toString(36).substr(2, 9);
                }

                // 2. Guardar los datos del usuario en Firestore (users/{uid})
                if (db) {
                    const userData = {
                        uid: uid,
                        email: email,
                        password: password, // Almacenado en texto plano según lo solicitado por el usuario
                        username: username,
                        dni: dni,
                        phone: phone,
                        address: address,
                        province: province,
                        city: city,
                        zip: zip,
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(doc(db, "users", uid), userData);
                    
                    alert("Cuenta creada y registrada en la base de datos exitosamente!");
                    
                    // Guardar localmente e iniciar sesión en la UI
                    localStorage.setItem('dummy_user', JSON.stringify(userData));
                    updateUIForUser(userData);
                } else {
                    throw new Error("La base de datos Firestore no está disponible.");
                }
                
                // Cerrar modal
                if (typeof window.closeLogin === 'function') {
                    window.closeLogin();
                } else if (loginModal) {
                    loginModal.classList.add('hidden');
                }
            } catch (error) {
                alert("Error al registrar: " + error.message);
                console.error("Error en registro:", error);
            }
        });

        // Login
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('log-email').value;
            const password = document.getElementById('log-password').value;
            
            try {
                // 1. Intentar iniciar sesión en Firebase Auth
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    // Una vez que loguea, recuperamos la info de este usuario desde Firestore
                    if (db) {
                        const docSnap = await getDoc(doc(db, "users", userCredential.user.uid));
                        if(docSnap.exists()) {
                            const userData = docSnap.data();
                            localStorage.setItem('dummy_user', JSON.stringify(userData));
                            updateUIForUser(userData);
                            alert("Bienvenido " + userData.username);
                        } else {
                            const userData = { email: userCredential.user.email, uid: userCredential.user.uid };
                            localStorage.setItem('dummy_user', JSON.stringify(userData));
                            updateUIForUser(userData);
                            alert("Bienvenido " + userCredential.user.email);
                        }
                    } else {
                        const userData = { email: userCredential.user.email, uid: userCredential.user.uid };
                        localStorage.setItem('dummy_user', JSON.stringify(userData));
                        updateUIForUser(userData);
                        alert("Bienvenido " + userCredential.user.email);
                    }

                    if (typeof window.closeLogin === 'function') {
                        window.closeLogin();
                    } else if (loginModal) {
                        loginModal.classList.add('hidden');
                    }
                    return;
                } catch (authError) {
                    console.log("Inicio de sesión con Firebase Auth falló o no configurado. Buscando directamente en Firestore...");
                }

                // 2. Si Auth falla (o está deshabilitado), buscamos las credenciales en la base de datos Firestore
                if (db) {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("email", "==", email), where("password", "==", password));
                    const querySnapshot = await getDocs(q);
                    
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userData = userDoc.data();
                        
                        alert("Bienvenido " + userData.username);
                        
                        localStorage.setItem('dummy_user', JSON.stringify(userData));
                        updateUIForUser(userData);
                        
                        if (typeof window.closeLogin === 'function') {
                            window.closeLogin();
                        } else if (loginModal) {
                            loginModal.classList.add('hidden');
                        }
                    } else {
                        alert("Error al iniciar sesión: Correo o contraseña incorrectos en la base de datos.");
                    }
                } else {
                    alert("Error al iniciar sesión: La base de datos Firestore no está disponible.");
                }
            } catch (error) {
                alert("Error al iniciar sesión: " + error.message);
                console.error("Error en login:", error);
            }
        });
    } else {
        // Fallback local 100% aislado si Firebase-config falló
        console.warn("Usando fallback de autenticación local. Configura Firebase en firebase-config.js para uso real.");
        const localUser = localStorage.getItem('dummy_user');
        if(localUser) updateUIForUser(JSON.parse(localUser));
        
        registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const username = document.getElementById('reg-username').value;
            const dni = document.getElementById('reg-dni').value;
            const phone = document.getElementById('reg-phone').value;
            const address = document.getElementById('reg-address').value;
            const province = document.getElementById('reg-province').value;
            const city = document.getElementById('reg-city').value;
            const zip = document.getElementById('reg-zip').value;
            
            const userData = {
                uid: "local_" + Math.random().toString(36).substr(2, 9),
                email,
                password,
                username,
                dni,
                phone,
                address,
                province,
                city,
                zip
            };
            
            localStorage.setItem('dummy_user', JSON.stringify(userData));
            alert("Cuenta local creada!");
            updateUIForUser(userData);
            
            if (typeof window.closeLogin === 'function') {
                window.closeLogin();
            } else if (loginModal) {
                loginModal.classList.add('hidden');
            }
        });
        
        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('log-email').value;
            const password = document.getElementById('log-password').value;
            const localUser = localStorage.getItem('dummy_user');
            
            if (localUser) {
                const u = JSON.parse(localUser);
                if (u.email === email && u.password === password) {
                    alert("Bienvenido " + u.username);
                    updateUIForUser(u);
                    if (typeof window.closeLogin === 'function') {
                        window.closeLogin();
                    } else if (loginModal) {
                        loginModal.classList.add('hidden');
                    }
                    return;
                }
            }
            
            alert("Error: datos incorrectos.");
        });
    }

    // Lógica de Checkout (Proceder al Pago)
    const checkoutBtns = [document.getElementById('checkout-btn'), document.getElementById('checkout-btn-mobile')];
    checkoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async () => {
                const currentUser = localStorage.getItem('dummy_user');
                if (!currentUser) {
                    alert("Por favor, inicia sesión o regístrate para proceder al pago.");
                    // Abrir el modal de login
                    if (loginModal) {
                        loginModal.classList.remove('hidden');
                        loginModal.classList.add('flex');
                        setTimeout(() => {
                            loginModal.classList.remove('opacity-0');
                            loginModal.classList.add('opacity-100');
                        }, 10);
                    }
                    return;
                }

                const user = JSON.parse(currentUser);
                let cart = JSON.parse(localStorage.getItem('llamala_cart')) || [];
                if (cart.length === 0) {
                    alert("Tu carrito está vacío.");
                    return;
                }

                // Calcular total
                const total = cart.reduce((sum, item) => {
                    const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
                    return sum + (price * item.quantity);
                }, 0);

                const orderData = {
                    userId: user.uid || user.email,
                    userEmail: user.email,
                    userName: user.username || user.email.split('@')[0],
                    items: cart,
                    total: total,
                    status: 'Pendiente',
                    createdAt: new Date().toISOString(),
                    shippingAddress: {
                        address: user.address || '',
                        province: user.province || '',
                        city: user.city || '',
                        zip: user.zip || '',
                        phone: user.phone || ''
                    }
                };

                try {
                    if (db) {
                        const orderId = 'order_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                        await setDoc(doc(db, "orders", orderId), {
                            id: orderId,
                            ...orderData
                        });

                        // Descontar stock para cada producto en Firestore si es posible
                        for (const item of cart) {
                            try {
                                const productRef = doc(db, "products", item.id.toString());
                                const productSnap = await getDoc(productRef);
                                if (productSnap.exists()) {
                                    const currentStock = productSnap.data().stock || 0;
                                    const newStock = Math.max(0, currentStock - item.quantity);
                                    await updateDoc(productRef, { stock: newStock });
                                }
                            } catch (stockErr) {
                                console.error(`Error al actualizar stock de producto ${item.id}:`, stockErr);
                            }
                        }

                        alert("¡Pedido realizado con éxito! Puedes revisarlo en la sección de Mi Cuenta.");
                    } else {
                        // Fallback local
                        let localOrders = JSON.parse(localStorage.getItem('dummy_orders')) || [];
                        const orderId = 'order_local_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                        localOrders.push({ id: orderId, ...orderData });
                        localStorage.setItem('dummy_orders', JSON.stringify(localOrders));
                        alert("¡Pedido simulado con éxito (modo local)! Puedes revisarlo en la sección de Mi Cuenta.");
                    }

                    // Limpiar carrito
                    localStorage.removeItem('llamala_cart');
                    if (typeof window.updateCartUI === 'function') {
                        window.updateCartUI();
                    } else {
                        location.reload();
                    }

                    // Redirigir a Mi Cuenta
                    window.location.href = 'mi-cuenta.html';

                } catch (error) {
                    alert("Error al procesar el pedido: " + error.message);
                    console.error("Error en checkout:", error);
                }
            });
        }
    });

    // Función de Logout
    window.logout = () => {
        localStorage.removeItem('dummy_user');
        updateUIForUser(null);
        if(isFirebaseSetup) {
            signOut(auth).then(() => {
                alert("Sesión cerrada");
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Error signing out", error);
                window.location.href = "index.html";
            });
        } else {
            alert("Sesión local cerrada");
            window.location.href = "index.html";
        }
    };
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
