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

const showWelcomeModal = (username) => {
    let modal = document.getElementById('welcome-modal');
    if (!modal) {
        const modalHTML = `
        <div id="welcome-modal" class="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-500 ease-out">
            <div class="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center transform scale-90 translate-y-8 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-slate-100 dark:border-slate-800">
                <!-- Icon / Avatar Area with gradient ring -->
                <div class="relative mb-6">
                    <div class="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                    <div class="relative w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-white shadow-xl border border-indigo-200/50 dark:border-indigo-900">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <!-- Small pulsing badge -->
                    <span class="absolute top-1 right-1 flex h-4 w-4">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-4 w-4 bg-lime-500 border border-white dark:border-slate-950"></span>
                    </span>
                </div>
                
                <!-- Welcome Message -->
                <h3 class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2">¡Ingreso Exitoso!</h3>
                <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
                    ¡Bienvenido, <span id="welcome-username" class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500"></span>!
                </h2>
                <p class="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-6 font-medium">Nos alegra tenerte de vuelta en <span class="font-bold text-slate-800 dark:text-slate-200">Llamala Store</span>. Disfruta de la mejor tecnología.</p>
                
                <!-- Button -->
                <button id="welcome-accept-btn" class="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 text-white font-bold rounded-2xl transition-all duration-350 active:scale-[0.97] hover:scale-[1.02] shadow-lg shadow-indigo-600/25 text-sm flex items-center justify-center gap-2 cursor-pointer">
                    Comenzar a explorar
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </div>
        `;
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);
        modal = document.getElementById('welcome-modal');
    }

    // Set username
    document.getElementById('welcome-username').textContent = username;

    const card = modal.querySelector('div');
    
    // Show modal
    modal.classList.remove('pointer-events-none');
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    
    card.classList.remove('scale-90', 'translate-y-8');
    card.classList.add('scale-100', 'translate-y-0');

    let autoCloseTimer;

    const closeModal = () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        modal.classList.add('pointer-events-none');
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        card.classList.remove('scale-100', 'translate-y-0');
        card.classList.add('scale-90', 'translate-y-8');
        
        setTimeout(() => {
            modal.remove();
        }, 500);
    };

    document.getElementById('welcome-accept-btn').onclick = (e) => {
        e.preventDefault();
        closeModal();
    };

    autoCloseTimer = setTimeout(() => {
        closeModal();
    }, 4500);
};

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
                            showWelcomeModal(userData.username);
                        } else {
                            const userData = { email: userCredential.user.email, uid: userCredential.user.uid };
                            localStorage.setItem('dummy_user', JSON.stringify(userData));
                            updateUIForUser(userData);
                            showWelcomeModal(userCredential.user.email);
                        }
                    } else {
                        const userData = { email: userCredential.user.email, uid: userCredential.user.uid };
                        localStorage.setItem('dummy_user', JSON.stringify(userData));
                        updateUIForUser(userData);
                        showWelcomeModal(userCredential.user.email);
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
                        
                        showWelcomeModal(userData.username);
                        
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
                    showWelcomeModal(u.username);
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

    // Inyectar e inicializar el Modal de Pago
    const injectPaymentModal = () => {
        if (document.getElementById('payment-modal')) return;

        const modalHTML = `
        <div id="payment-modal" class="fixed inset-0 z-[150] overflow-y-auto bg-slate-900/60 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row transform translate-y-4 transition-all duration-300 max-h-[95vh] md:max-h-[85vh] relative text-slate-800 dark:text-slate-100">
                
                <!-- Botón de Cerrar -->
                <button id="close-payment-btn" class="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 hover:border-black dark:hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-20 bg-white dark:bg-slate-800" aria-label="Cerrar modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <!-- PANEL IZQUIERDO: Resumen del Pedido -->
                <div class="w-full md:w-5/12 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[40vh] md:max-h-none">
                    <div>
                        <!-- Logo / Título -->
                        <div class="flex items-center gap-3 mb-6">
                            <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" width="30" height="33" viewBox="0 0 30 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="m8 4.55 6.75 3.884 6.75-3.885M8 27.83v-7.755L1.25 16.19m27 0-6.75 3.885v7.754M1.655 8.658l13.095 7.546 13.095-7.546M14.75 31.25V16.189m13.5 5.976V10.212a2.98 2.98 0 0 0-1.5-2.585L16.25 1.65a3.01 3.01 0 0 0-3 0L2.75 7.627a3 3 0 0 0-1.5 2.585v11.953a2.98 2.98 0 0 0 1.5 2.585l10.5 5.977a3.01 3.01 0 0 0 3 0l10.5-5.977a3 3 0 0 0 1.5-2.585" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span class="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white">Llamala Store</span>
                        </div>

                        <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Resumen del Pedido</h3>
                        
                        <!-- Lista de Productos -->
                        <div id="payment-items-list" class="space-y-4 max-h-[180px] md:max-h-[300px] overflow-y-auto pr-1">
                            <!-- Carga dinámica -->
                        </div>
                    </div>

                    <!-- Totales -->
                    <div class="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Descuentos y Ofertas</span>
                            <span class="font-semibold text-gray-800 dark:text-slate-200" id="payment-discount">S/0.00</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>IGV (18%)</span>
                            <span class="font-semibold text-gray-800 dark:text-slate-200" id="payment-tax">S/0.00</span>
                        </div>
                        <div class="flex justify-between text-base font-bold pt-2 border-t border-slate-100 dark:border-slate-900">
                            <span class="text-gray-900 dark:text-white">Total</span>
                            <span class="text-indigo-600 dark:text-indigo-400 text-lg font-black" id="payment-total">S/0.00</span>
                        </div>
                    </div>
                </div>

                <!-- PANEL DERECHO: Formulario de Pago -->
                <div class="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[55vh] md:max-h-none">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-5 text-left">Método de Pago</h2>
                        
                        <!-- Pestañas de Pago -->
                        <div class="grid grid-cols-2 gap-3 mb-6">
                            <button id="pay-tab-card" type="button" class="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-xs transition-all duration-300 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                Tarjeta de Crédito/Débito
                            </button>
                            <button id="pay-tab-qr" type="button" class="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-xs transition-all duration-300 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <rect x="7" y="7" width="3" height="3"></rect>
                                    <rect x="14" y="7" width="3" height="3"></rect>
                                    <rect x="7" y="14" width="3" height="3"></rect>
                                    <path d="M14 14h3v3h-3z"></path>
                                </svg>
                                Pago QR (Yape/Plin)
                            </button>
                        </div>

                        <!-- CONTENIDO DE TABS -->
                        <div id="payment-tabs-content">
                            <!-- TAB 1: FORMULARIO DE TARJETA -->
                            <form id="card-payment-form" class="space-y-4">
                                <div class="flex flex-col text-left">
                                    <label class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nombre del Titular</label>
                                    <input id="card-holder-name" placeholder="Ej: JUAN PEREZ" required class="mt-1 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white uppercase font-sans font-medium" type="text">
                                </div>
                                <div class="flex flex-col text-left relative">
                                    <label class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Número de Tarjeta</label>
                                    <div class="relative mt-1">
                                        <input id="card-number" placeholder="4000 1234 5678 9010" maxlength="19" required class="rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none pl-16 pr-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-sans font-medium" type="text">
                                        <div class="absolute inset-y-0 left-4 flex items-center justify-center" id="card-brand-logo">
                                            <!-- Logo dinámico -->
                                            <svg class="text-gray-400 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                                                <line x1="2" y1="10" x2="22" y2="10"></line>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="flex flex-col text-left">
                                        <label class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vencimiento</label>
                                        <input id="card-expiry" placeholder="MM/YY" maxlength="5" required class="mt-1 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-sans font-medium" type="text">
                                    </div>
                                    <div class="flex flex-col text-left">
                                        <label class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">CVC</label>
                                        <input id="card-cvc" placeholder="123" maxlength="3" required class="mt-1 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-sans font-medium" type="password">
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="card-save" class="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 bg-white dark:bg-slate-950">
                                    <label for="card-save" class="text-xs text-gray-500 dark:text-gray-400 font-medium">Recordar esta tarjeta bancaria</label>
                                </div>
                                <button type="submit" id="card-pay-btn" class="mt-4 py-3.5 w-full cursor-pointer rounded-xl bg-indigo-600 text-white font-bold transition hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2">
                                    Pagar Ahora
                                </button>
                            </form>

                            <!-- TAB 2: PAGO QR (YAPE/PLIN) -->
                            <div id="qr-payment-container" class="space-y-5 hidden">
                                <div class="bg-indigo-50/40 dark:bg-slate-950/60 border border-indigo-100/50 dark:border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
                                    <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                    </div>
                                    <div class="text-left font-sans">
                                        <h4 class="text-xs font-bold text-gray-900 dark:text-white mb-0.5">Instrucciones de Pago</h4>
                                        <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-normal">Escanea el código QR de Yape o Plin con tu aplicación móvil preferida. Luego de realizar la transferencia de forma simulada, haz clic en el botón de abajo para registrar tu pedido.</p>
                                    </div>
                                </div>
                                
                                <!-- QR Mockup Container -->
                                <div class="flex flex-col items-center justify-center border border-dashed border-gray-250 dark:border-slate-850 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/20 gap-3.5">
                                    <div class="bg-white p-3.5 rounded-2xl shadow-md border border-gray-100 relative">
                                        <!-- QR Code Generator Mock using SVG -->
                                        <svg class="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <!-- QR Finder Patterns -->
                                            <rect x="0" y="0" width="30" height="30" fill="black"/>
                                            <rect x="5" y="5" width="20" height="20" fill="white"/>
                                            <rect x="10" y="10" width="10" height="10" fill="black"/>

                                            <rect x="70" y="0" width="30" height="30" fill="black"/>
                                            <rect x="75" y="5" width="20" height="20" fill="white"/>
                                            <rect x="80" y="10" width="10" height="10" fill="black"/>

                                            <rect x="0" y="70" width="30" height="30" fill="black"/>
                                            <rect x="5" y="75" width="20" height="20" fill="white"/>
                                            <rect x="10" y="80" width="10" height="10" fill="black"/>
                                            
                                            <!-- QR Random Bits -->
                                            <rect x="40" y="10" width="10" height="10" fill="black"/>
                                            <rect x="50" y="20" width="10" height="10" fill="black"/>
                                            <rect x="80" y="40" width="10" height="10" fill="black"/>
                                            <rect x="10" y="50" width="10" height="10" fill="black"/>
                                            <rect x="30" y="30" width="10" height="10" fill="black"/>
                                            <rect x="60" y="60" width="10" height="10" fill="black"/>
                                            <rect x="50" y="50" width="10" height="10" fill="black"/>
                                            <rect x="40" y="60" width="10" height="10" fill="black"/>
                                            <rect x="70" y="80" width="10" height="10" fill="black"/>
                                            <rect x="90" y="70" width="10" height="10" fill="black"/>
                                            <rect x="80" y="80" width="10" height="10" fill="black"/>
                                            <rect x="40" y="80" width="10" height="10" fill="black"/>
                                            <rect x="50" y="90" width="10" height="10" fill="black"/>
                                            <rect x="90" y="90" width="10" height="10" fill="black"/>
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-2.5 font-sans">
                                        <div class="px-3 py-1.5 text-xs font-black tracking-wider rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 select-none">YAPE</div>
                                        <span class="text-xs text-gray-400">o</span>
                                        <div class="px-3 py-1.5 text-xs font-black tracking-wider rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20 select-none">PLIN</div>
                                    </div>
                                </div>

                                <button id="qr-pay-btn" type="button" class="py-3.5 w-full cursor-pointer rounded-xl bg-lime-500 text-neutral-900 font-bold transition hover:bg-lime-400 active:scale-[0.98] shadow-lg shadow-lime-500/20 text-sm flex items-center justify-center gap-2">
                                    Confirmar Pago Yape/Plin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);
    };

    const openPaymentModal = (orderData) => {
        injectPaymentModal();
        const modal = document.getElementById('payment-modal');
        const card = modal.querySelector('div');
        
        // Cargar productos en el resumen
        const listContainer = document.getElementById('payment-items-list');
        listContainer.innerHTML = orderData.items.map(item => `
            <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                <img src="${item.img}" alt="${item.name}" class="w-12 h-12 object-contain bg-white dark:bg-white/90 border border-slate-200 dark:border-slate-850 rounded-xl p-1">
                <div class="flex-1 min-w-0 text-left">
                    <p class="text-xs font-bold text-gray-900 dark:text-white truncate">${item.name}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400">${item.brand} x ${item.quantity}</p>
                </div>
                <span class="text-xs font-bold text-gray-950 dark:text-white">${item.price}</span>
            </div>
        `).join('');

        // Cargar totales
        const subtotal = orderData.total;
        const discountVal = 0.00; 
        const taxVal = 0.00; // Simulado según diseño
        document.getElementById('payment-discount').textContent = `S/${discountVal.toFixed(2)}`;
        document.getElementById('payment-tax').textContent = `S/${taxVal.toFixed(2)}`;
        document.getElementById('payment-total').textContent = `S/${subtotal.toFixed(2)}`;
        
        // Pestañas
        const tabCard = document.getElementById('pay-tab-card');
        const tabQr = document.getElementById('pay-tab-qr');
        const formCard = document.getElementById('card-payment-form');
        const containerQr = document.getElementById('qr-payment-container');

        tabCard.onclick = () => {
            tabCard.className = "flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-xs transition-all duration-300 cursor-pointer";
            tabQr.className = "flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-xs transition-all duration-300 cursor-pointer";
            formCard.classList.remove('hidden');
            containerQr.classList.add('hidden');
        };

        tabQr.onclick = () => {
            tabQr.className = "flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-xs transition-all duration-300 cursor-pointer";
            tabCard.className = "flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-xs transition-all duration-300 cursor-pointer";
            containerQr.classList.remove('hidden');
            formCard.classList.add('hidden');
        };

        // Formateador de Tarjeta
        const inputCardNum = document.getElementById('card-number');
        const brandLogo = document.getElementById('card-brand-logo');
        
        // Reiniciar valores del formulario
        document.getElementById('card-holder-name').value = '';
        inputCardNum.value = '';
        document.getElementById('card-expiry').value = '';
        document.getElementById('card-cvc').value = '';
        brandLogo.innerHTML = `
            <svg class="text-gray-450 dark:text-gray-550" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
        `;

        inputCardNum.oninput = (e) => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) formattedValue += ' ';
                formattedValue += value[i];
            }
            e.target.value = formattedValue;

            if (value.startsWith('4')) {
                brandLogo.innerHTML = `<span class="text-blue-600 dark:text-blue-400 font-black italic tracking-wider text-[11px] select-none bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">VISA</span>`;
            } else if (value.startsWith('5')) {
                brandLogo.innerHTML = `<span class="text-orange-500 dark:text-orange-400 font-black italic tracking-wider text-[11px] select-none bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded">MC</span>`;
            } else {
                brandLogo.innerHTML = `
                    <svg class="text-gray-400 dark:text-gray-650" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                `;
            }
        };

        // Formateador de Fecha de Expiración
        const inputCardExpiry = document.getElementById('card-expiry');
        inputCardExpiry.oninput = (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                e.target.value = value;
            }
        };

        // Formateador de CVC
        const inputCardCvc = document.getElementById('card-cvc');
        inputCardCvc.oninput = (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        };

        // Manejar Cerrar Modal
        const closePayment = () => {
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0');
            if (card) {
                card.classList.remove('translate-y-0');
                card.classList.add('translate-y-4');
            }
            document.body.style.overflow = '';
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        };

        document.getElementById('close-payment-btn').onclick = (e) => {
            e.preventDefault();
            closePayment();
        };

        modal.onclick = (e) => {
            if (e.target === modal) closePayment();
        };

        // Registrar orden en DB/Local
        const processOrderSuccess = async (method) => {
            try {
                if (db) {
                    const orderId = 'order_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                    await setDoc(doc(db, "orders", orderId), {
                        id: orderId,
                        paymentMethod: method,
                        ...orderData
                    });

                    // Descontar stock
                    for (const item of orderData.items) {
                        if (item.isService || (item.id && item.id.toString().startsWith('s'))) {
                            continue;
                        }
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
                    alert("¡Pago simulado con éxito y pedido realizado! Puedes revisarlo en la sección de Mi Cuenta.");
                } else {
                    // Fallback local
                    let localOrders = JSON.parse(localStorage.getItem('dummy_orders')) || [];
                    const orderId = 'order_local_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                    localOrders.push({ id: orderId, paymentMethod: method, ...orderData });
                    localStorage.setItem('dummy_orders', JSON.stringify(localOrders));
                    alert("¡Pago simulado con éxito (modo local)! Puedes revisarlo en la sección de Mi Cuenta.");
                }

                // Limpiar carrito
                localStorage.removeItem('llamala_cart');
                if (typeof window.updateCartUI === 'function') {
                    window.updateCartUI();
                }

                closePayment();
                window.location.href = 'mi-cuenta.html';
            } catch (error) {
                alert("Error al procesar el pedido: " + error.message);
                console.error("Error en checkout:", error);
            }
        };

        // Submit de Formulario Tarjeta
        formCard.onsubmit = async (e) => {
            e.preventDefault();
            const payBtn = document.getElementById('card-pay-btn');
            const originalContent = payBtn.innerHTML;

            const name = document.getElementById('card-holder-name').value.trim();
            const number = document.getElementById('card-number').value.replace(/\s+/g, '');
            const expiry = document.getElementById('card-expiry').value;
            const cvc = document.getElementById('card-cvc').value;

            if (name.length < 3) {
                alert("Por favor ingrese el nombre del titular.");
                return;
            }
            if (number.length !== 16) {
                alert("Por favor ingrese un número de tarjeta de 16 dígitos válido.");
                return;
            }
            if (expiry.length !== 5 || !expiry.includes('/')) {
                alert("Por favor ingrese una fecha de expiración válida (MM/YY).");
                return;
            }
            if (cvc.length !== 3) {
                alert("Por favor ingrese un código CVC de 3 dígitos válido.");
                return;
            }

            payBtn.disabled = true;
            payBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando Pago...
            `;

            setTimeout(async () => {
                await processOrderSuccess('Tarjeta');
                payBtn.disabled = false;
                payBtn.innerHTML = originalContent;
            }, 2000);
        };

        // Confirmar Yape/Plin
        document.getElementById('qr-pay-btn').onclick = async (e) => {
            e.preventDefault();
            const qrBtn = document.getElementById('qr-pay-btn');
            const originalContent = qrBtn.innerHTML;

            qrBtn.disabled = true;
            qrBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-neutral-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirmando Pago...
            `;

            setTimeout(async () => {
                await processOrderSuccess('Yape/Plin');
                qrBtn.disabled = false;
                qrBtn.innerHTML = originalContent;
            }, 2000);
        };

        // Mostrar Modal con animaciones
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            if (card) {
                card.classList.remove('translate-y-4');
                card.classList.add('translate-y-0');
            }
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    // Lógica de Checkout (Proceder al Pago)
    const checkoutBtns = [document.getElementById('checkout-btn'), document.getElementById('checkout-btn-mobile')];
    checkoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async () => {
                const currentUser = localStorage.getItem('dummy_user');
                if (!currentUser) {
                    alert("Por favor, inicia sesión o regístrate para proceder al pago.");
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

                // Abrir modal de pago en vez de proceder directamente
                openPaymentModal(orderData);
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
