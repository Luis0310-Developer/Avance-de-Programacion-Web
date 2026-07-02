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
import { RAW_SHALOM_DATA } from './shalom-data.js';


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

    // === MOCK GEOGRAPHICAL DATA & SHIPPING METHODS ===
    // === MOCK GEOGRAPHICAL DATA & SHIPPING METHODS ===
    function classifyAgency(name, address) {
        const n = name.toLowerCase();
        const a = address.toLowerCase();

        // 1. Amazonas
        if (n.includes("chachapoyas") || a.includes("chachapoyas")) {
            return { dep: "Amazonas", prov: "Chachapoyas", dist: "Chachapoyas" };
        }
        if (n.includes("bagua capital") || a.includes("bagua - amazonas")) {
            return { dep: "Amazonas", prov: "Bagua", dist: "Bagua" };
        }
        if (n.includes("pedro ruiz") || a.includes("pedro ruiz")) {
            return { dep: "Amazonas", prov: "Bongará", dist: "Jazán" };
        }
        if (n.includes("luya")) {
            return { dep: "Amazonas", prov: "Luya", dist: "Luya" };
        }
        if (n.includes("bagua grande")) {
            return { dep: "Amazonas", prov: "Utcubamba", dist: "Bagua Grande" };
        }

        // 2. Ancash
        if (n.includes("huaraz")) {
            return { dep: "Ancash", prov: "Huaraz", dist: "Huaraz" };
        }
        if (n.includes("carhuaz")) {
            return { dep: "Ancash", prov: "Carhuaz", dist: "Carhuaz" };
        }
        if (n.includes("casma")) {
            return { dep: "Ancash", prov: "Casma", dist: "Casma" };
        }
        if (n.includes("huarmey")) {
            return { dep: "Ancash", prov: "Huarmey", dist: "Huarmey" };
        }
        if (n.includes("caraz")) {
            return { dep: "Ancash", prov: "Huaylas", dist: "Caraz" };
        }
        if (n.includes("nuevo chimbote")) {
            return { dep: "Ancash", prov: "Santa", dist: "Nuevo Chimbote" };
        }
        if (n.includes("chimbote")) {
            return { dep: "Ancash", prov: "Santa", dist: "Chimbote" };
        }
        if (n.includes("santa")) {
            return { dep: "Ancash", prov: "Santa", dist: "Santa" };
        }
        if (n.includes("yungay")) {
            return { dep: "Ancash", prov: "Yungay", dist: "Yungay" };
        }

        // 3. Apurímac
        if (n.includes("abancay")) {
            return { dep: "Apurímac", prov: "Abancay", dist: "Abancay" };
        }
        if (n.includes("andahuaylas")) {
            return { dep: "Apurímac", prov: "Andahuaylas", dist: "Andahuaylas" };
        }
        if (n.includes("challhuahuacho")) {
            return { dep: "Apurímac", prov: "Cotabambas", dist: "Challhuahuacho" };
        }

        // 4. Arequipa
        if (n.includes("alto selva alegre")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Alto Selva Alegre" };
        }
        if (n.includes("cayma")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Cayma" };
        }
        if (n.includes("cerro colorado") || n.includes("la joya") || n.includes("autopista")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Cerro Colorado" };
        }
        if (n.includes("hunter")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Jacobo Hunter" };
        }
        if (n.includes("mariano melgar")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Mariano Melgar" };
        }
        if (n.includes("miraflores arequipa")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Miraflores" };
        }
        if (n.includes("paucarpata")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Paucarpata" };
        }
        if (n.includes("socabaya")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Socabaya" };
        }
        if (n.includes("uchumayo")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Uchumayo" };
        }
        if (n.includes("yura")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Yura" };
        }
        if (n.includes("camana") || n.includes("camaná")) {
            return { dep: "Arequipa", prov: "Camaná", dist: "Camaná" };
        }
        if (n.includes("chala")) {
            return { dep: "Arequipa", prov: "Caravelí", dist: "Chala" };
        }
        if (n.includes("aplao")) {
            return { dep: "Arequipa", prov: "Castilla", dist: "Aplao" };
        }
        if (n.includes("majes")) {
            return { dep: "Arequipa", prov: "Caylloma", dist: "Majes" };
        }
        if (n.includes("mollendo") || n.includes("cocachacra") || n.includes("matarani")) {
            let d = "Mollendo";
            if (n.includes("cocachacra")) d = "Cocachacra";
            else if (n.includes("matarani")) d = "Matarani";
            return { dep: "Arequipa", prov: "Islay", dist: d };
        }
        if (n.includes("arequipa")) {
            return { dep: "Arequipa", prov: "Arequipa", dist: "Arequipa Cercado" };
        }

        // 5. Ayacucho
        if (n.includes("carmen alto")) {
            return { dep: "Ayacucho", prov: "Huamanga", dist: "Carmen Alto" };
        }
        if (n.includes("san juan bautista") && !n.includes("loreto")) {
            return { dep: "Ayacucho", prov: "Huamanga", dist: "San Juan Bautista" };
        }
        if (n.includes("jesus nazareno") || n.includes("jesús nazareno")) {
            return { dep: "Ayacucho", prov: "Huamanga", dist: "Jesús Nazareno" };
        }
        if (n.includes("huanta")) {
            return { dep: "Ayacucho", prov: "Huanta", dist: "Huanta" };
        }
        if (n.includes("ayacucho")) {
            return { dep: "Ayacucho", prov: "Huamanga", dist: "Ayacucho Cercado" };
        }

        // 6. Cajamarca
        if (n.includes("baños del inca")) {
            return { dep: "Cajamarca", prov: "Cajamarca", dist: "Baños del Inca" };
        }
        if (n.includes("cajabamba")) {
            return { dep: "Cajamarca", prov: "Cajabamba", dist: "Cajabamba" };
        }
        if (n.includes("celendin") || n.includes("celendín")) {
            return { dep: "Cajamarca", prov: "Celendín", dist: "Celendín" };
        }
        if (n.includes("chota")) {
            return { dep: "Cajamarca", prov: "Chota", dist: "Chota" };
        }
        if (n.includes("chilete")) {
            return { dep: "Cajamarca", prov: "Contumazá", dist: "Chilete" };
        }
        if (n.includes("tembladera")) {
            return { dep: "Cajamarca", prov: "Contumazá", dist: "Tembladera" };
        }
        if (n.includes("cutervo")) {
            return { dep: "Cajamarca", prov: "Cutervo", dist: "Cutervo" };
        }
        if (n.includes("bambamarca")) {
            return { dep: "Cajamarca", prov: "Hualgayoc", dist: "Bambamarca" };
        }
        if (n.includes("jaen") || n.includes("jaén")) {
            return { dep: "Cajamarca", prov: "Jaén", dist: "Jaén" };
        }
        if (n.includes("san ignacio")) {
            return { dep: "Cajamarca", prov: "San Ignacio", dist: "San Ignacio" };
        }
        if (n.includes("san marcos")) {
            return { dep: "Cajamarca", prov: "San Marcos", dist: "San Marcos" };
        }
        if (n.includes("san miguel")) {
            return { dep: "Cajamarca", prov: "San Miguel", dist: "San Miguel" };
        }
        if (n.includes("san pablo")) {
            return { dep: "Cajamarca", prov: "San Pablo", dist: "San Pablo" };
        }
        if (n.includes("cajamarca") || n.includes("huaraclla") || n.includes("cajamarca")) {
            return { dep: "Cajamarca", prov: "Cajamarca", dist: "Cajamarca" };
        }

        // 7. Callao
        if (n.includes("bellavista")) {
            return { dep: "Callao", prov: "Callao", dist: "Bellavista" };
        }
        if (n.includes("la perla")) {
            return { dep: "Callao", prov: "Callao", dist: "La Perla" };
        }
        if (n.includes("ventanilla")) {
            return { dep: "Callao", prov: "Callao", dist: "Ventanilla" };
        }
        if (n.includes("mi peru") || n.includes("mi perú")) {
            return { dep: "Callao", prov: "Callao", dist: "Mi Perú" };
        }
        if (n.includes("callao")) {
            return { dep: "Callao", prov: "Callao", dist: "Callao" };
        }

        // 8. Cusco
        if (n.includes("san jeronimo") || n.includes("san jerónimo")) {
            return { dep: "Cusco", prov: "Cusco", dist: "San Jerónimo" };
        }
        if (n.includes("san sebastian") || n.includes("san sebastián")) {
            return { dep: "Cusco", prov: "Cusco", dist: "San Sebastián" };
        }
        if (n.includes("santiago")) {
            return { dep: "Cusco", prov: "Cusco", dist: "Santiago" };
        }
        if (n.includes("wanchaq")) {
            return { dep: "Cusco", prov: "Cusco", dist: "Wanchaq" };
        }
        if (n.includes("anta")) {
            return { dep: "Cusco", prov: "Anta", dist: "Anta" };
        }
        if (n.includes("calca")) {
            return { dep: "Cusco", prov: "Calca", dist: "Calca" };
        }
        if (n.includes("pisac")) {
            return { dep: "Cusco", prov: "Calca", dist: "Pisac" };
        }
        if (n.includes("sicuani") || n.includes("combapata")) {
            return { dep: "Cusco", prov: "Canchis", dist: n.includes("sicuani") ? "Sicuani" : "Combapata" };
        }
        if (n.includes("santo tomas") || n.includes("santo tomás")) {
            return { dep: "Cusco", prov: "Chumbivilcas", dist: "Santo Tomás" };
        }
        if (n.includes("espinar")) {
            return { dep: "Cusco", prov: "Espinar", dist: "Espinar" };
        }
        if (n.includes("quillabamba")) {
            return { dep: "Cusco", prov: "La Convención", dist: "Santa Ana" };
        }
        if (n.includes("urcos") || n.includes("ocongate") || n.includes("oropesa")) {
            let d = "Urcos";
            if (n.includes("ocongate")) d = "Ocongate";
            else if (n.includes("oropesa")) d = "Oropesa";
            return { dep: "Cusco", prov: "Quispicanchi", dist: d };
        }
        if (n.includes("urubamba")) {
            return { dep: "Cusco", prov: "Urubamba", dist: "Urubamba" };
        }
        if (n.includes("chinchero")) {
            return { dep: "Cusco", prov: "Urubamba", dist: "Chinchero" };
        }
        if (n.includes("cusco")) {
            return { dep: "Cusco", prov: "Cusco", dist: "Cusco Cercado" };
        }

        // 9. Huancavelica
        if (n.includes("huancavelica")) {
            return { dep: "Huancavelica", prov: "Huancavelica", dist: "Huancavelica" };
        }

        // 10. Huánuco
        if (n.includes("amarilis")) {
            return { dep: "Huánuco", prov: "Huánuco", dist: "Amarilis" };
        }
        if (n.includes("ambo")) {
            return { dep: "Huánuco", prov: "Ambo", dist: "Ambo" };
        }
        if (n.includes("tingo maria") || n.includes("tingo maría")) {
            return { dep: "Huánuco", prov: "Leoncio Prado", dist: "Rupa-Rupa" };
        }
        if (n.includes("aucayacu")) {
            return { dep: "Huánuco", prov: "Leoncio Prado", dist: "José Crespo y Castillo" };
        }
        if (n.includes("huanuco") || n.includes("huánuco")) {
            return { dep: "Huánuco", prov: "Huánuco", dist: "Huánuco" };
        }

        // 11. Ica
        if (n.includes("la tinguiña")) {
            return { dep: "Ica", prov: "Ica", dist: "La Tinguiña" };
        }
        if (n.includes("parcona")) {
            return { dep: "Ica", prov: "Ica", dist: "Parcona" };
        }
        if (n.includes("salas")) {
            return { dep: "Ica", prov: "Ica", dist: "Salas" };
        }
        if (n.includes("subtanjalla")) {
            return { dep: "Ica", prov: "Ica", dist: "Subtanjalla" };
        }
        if (n.includes("chincha") || n.includes("sunampe")) {
            let d = "Chincha Alta";
            if (n.includes("sunampe")) d = "Sunampe";
            else if (n.includes("pueblo nuevo")) d = "Pueblo Nuevo";
            return { dep: "Ica", prov: "Chincha", dist: d };
        }
        if (n.includes("nazca") || n.includes("marcona") || n.includes("vista alegre")) {
            let d = "Nasca";
            if (n.includes("marcona")) d = "San Juan de Marcona";
            else if (n.includes("vista alegre")) d = "Vista Alegre";
            return { dep: "Ica", prov: "Nasca", dist: d };
        }
        if (n.includes("pisco") || n.includes("san clemente")) {
            return { dep: "Ica", prov: "Pisco", dist: n.includes("san clemente") ? "San Clemente" : "Pisco" };
        }
        if (n.includes("ica")) {
            return { dep: "Ica", prov: "Ica", dist: "Ica" };
        }

        // 12. Junín
        if (n.includes("chilca")) {
            return { dep: "Junín", prov: "Huancayo", dist: "Chilca" };
        }
        if (n.includes("el tambo")) {
            return { dep: "Junín", prov: "Huancayo", dist: "El Tambo" };
        }
        if (n.includes("pilcomayo")) {
            return { dep: "Junín", prov: "Huancayo", dist: "Pilcomayo" };
        }
        if (n.includes("cajas")) {
            return { dep: "Junín", prov: "Huancayo", dist: "San Agustín de Cajas" };
        }
        if (n.includes("concepcion") || n.includes("concepción")) {
            return { dep: "Junín", prov: "Concepción", dist: "Concepción" };
        }
        if (n.includes("la merced") || n.includes("perene") || n.includes("perené") || n.includes("pichanaki") || n.includes("san ramón") || n.includes("san ramon")) {
            let d = "San Ramón";
            if (n.includes("la merced")) d = "Chanchamayo";
            else if (n.includes("perene") || n.includes("perené")) d = "Perené";
            else if (n.includes("pichanaki")) d = "Pichanaqui";
            return { dep: "Junín", prov: "Chanchamayo", dist: d };
        }
        if (n.includes("jauja")) {
            return { dep: "Junín", prov: "Jauja", dist: "Jauja" };
        }
        if (n.includes("satipo") || n.includes("mazamari") || n.includes("pangoa")) {
            let d = "Satipo";
            if (n.includes("mazamari")) d = "Mazamari";
            else if (n.includes("pangoa")) d = "Pangoa";
            return { dep: "Junín", prov: "Satipo", dist: d };
        }
        if (n.includes("tarma")) {
            return { dep: "Junín", prov: "Tarma", dist: "Tarma" };
        }
        if (n.includes("oroya")) {
            return { dep: "Junín", prov: "Yauli", dist: "La Oroya" };
        }
        if (n.includes("chupaca")) {
            return { dep: "Junín", prov: "Chupaca", dist: "Chupaca" };
        }
        if (n.includes("huancayo")) {
            return { dep: "Junín", prov: "Huancayo", dist: "Huancayo" };
        }

        // 13. La Libertad
        if (n.includes("el porvenir")) {
            return { dep: "La Libertad", prov: "Trujillo", dist: "El Porvenir" };
        }
        if (n.includes("huanchaco")) {
            return { dep: "La Libertad", prov: "Trujillo", dist: "Huanchaco" };
        }
        if (n.includes("la esperanza")) {
            return { dep: "La Libertad", prov: "Trujillo", dist: "La Esperanza" };
        }
        if (n.includes("moche")) {
            return { dep: "La Libertad", prov: "Trujillo", dist: "Moche" };
        }
        if (n.includes("paijan") || n.includes("paiján") || n.includes("casa grande")) {
            return { dep: "La Libertad", prov: "Ascope", dist: n.includes("casa grande") ? "Casa Grande" : "Paiján" };
        }
        if (n.includes("chepen") || n.includes("chepén") || n.includes("pacanguilla")) {
            return { dep: "La Libertad", prov: "Chepén", dist: n.includes("pacanguilla") ? "Pacanga" : "Chepén" };
        }
        if (n.includes("otuzco")) {
            return { dep: "La Libertad", prov: "Otuzco", dist: "Otuzco" };
        }
        if (n.includes("san pedro")) {
            return { dep: "La Libertad", prov: "Pacasmayo", dist: "San Pedro de Lloc" };
        }
        if (n.includes("ciudad de dios")) {
            return { dep: "La Libertad", prov: "Pacasmayo", dist: "Guadalupe" };
        }
        if (n.includes("guadalupe")) {
            return { dep: "La Libertad", prov: "Pacasmayo", dist: "Guadalupe" };
        }
        if (n.includes("pacasmayo")) {
            return { dep: "La Libertad", prov: "Pacasmayo", dist: "Pacasmayo" };
        }
        if (n.includes("huamachuco")) {
            return { dep: "La Libertad", prov: "Sánchez Carrión", dist: "Huamachuco" };
        }
        if (n.includes("viru") || n.includes("virú") || n.includes("chao")) {
            return { dep: "La Libertad", prov: "Virú", dist: n.includes("chao") ? "Chao" : "Virú" };
        }
        if (n.includes("trujillo") || n.includes("el milagro")) {
            return { dep: "La Libertad", prov: "Trujillo", dist: "Trujillo" };
        }

        // 14. Lambayeque
        if (n.includes("chongoyape")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Chongoyape" };
        }
        if (n.includes("leonardo ortiz")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "José Leonardo Ortiz" };
        }
        if (n.includes("la victoria")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "La Victoria" };
        }
        if (n.includes("monsefu") || n.includes("monsefú")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Monsefú" };
        }
        if (n.includes("pimentel")) {
            return { dep: "Lambayeque", prov: "Chiclayo", font: "medium", dist: "Pimentel" };
        }
        if (n.includes("reque")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Reque" };
        }
        if (n.includes("patapo") || n.includes("pátapo")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Pátapo" };
        }
        if (n.includes("pomalca")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Pomalca" };
        }
        if (n.includes("tuman") || n.includes("tumán")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Tumán" };
        }
        if (n.includes("ferreñafe")) {
            return { dep: "Lambayeque", prov: "Ferreñafe", dist: "Ferreñafe" };
        }
        if (n.includes("jayanca") || n.includes("morrope") || n.includes("mórrope") || n.includes("motupe") || n.includes("olmos") || n.includes("tucume") || n.includes("túcume")) {
            let d = "Olmos";
            if (n.includes("jayanca")) d = "Jayanca";
            else if (n.includes("morrope") || n.includes("mórrope")) d = "Mórrope";
            else if (n.includes("motupe")) d = "Motupe";
            else if (n.includes("tucume") || n.includes("túcume")) d = "Túcume";
            return { dep: "Lambayeque", prov: "Lambayeque", dist: d };
        }
        if (n.includes("lambayeque")) {
            return { dep: "Lambayeque", prov: "Lambayeque", dist: "Lambayeque" };
        }
        if (n.includes("chiclayo")) {
            return { dep: "Lambayeque", prov: "Chiclayo", dist: "Chiclayo" };
        }

        // 15. Loreto
        if (n.includes("punchana")) {
            return { dep: "Loreto", prov: "Maynas", dist: "Punchana" };
        }
        if (n.includes("san juan bautista") && (n.includes("loreto") || a.includes("iquitos"))) {
            return { dep: "Loreto", prov: "Maynas", dist: "San Juan Bautista" };
        }
        if (n.includes("yurimaguas")) {
            return { dep: "Loreto", prov: "Alto Amazonas", dist: "Yurimaguas" };
        }
        if (n.includes("iquitos")) {
            return { dep: "Loreto", prov: "Maynas", dist: "Iquitos" };
        }

        // 16. Madre de Dios
        if (n.includes("mazuko")) {
            return { dep: "Madre de Dios", prov: "Tambopata", dist: "Inambari" };
        }
        if (n.includes("iberia")) {
            return { dep: "Madre de Dios", prov: "Tahuamanu", dist: "Iberia" };
        }
        if (n.includes("tambopata") || n.includes("el triunfo") || a.includes("ptomaldonado") || a.includes("maldonado")) {
            return { dep: "Madre de Dios", prov: "Tambopata", dist: "Tambopata" };
        }

        // 17. Moquegua
        if (n.includes("ilo")) {
            return { dep: "Moquegua", prov: "Ilo", dist: "Ilo" };
        }
        if (n.includes("moquegua") || n.includes("chen chen")) {
            return { dep: "Moquegua", prov: "Mariscal Nieto", dist: "Moquegua" };
        }

        // 18. Pasco
        if (n.includes("huayllay")) {
            return { dep: "Pasco", prov: "Pasco", dist: "Huayllay" };
        }
        if (n.includes("oxapampa")) {
            return { dep: "Pasco", prov: "Oxapampa", dist: "Oxapampa" };
        }
        if (n.includes("villa rica")) {
            return { dep: "Pasco", prov: "Oxapampa", dist: "Villa Rica" };
        }
        if (n.includes("cerro de pasco") || n.includes("pasco")) {
            return { dep: "Pasco", prov: "Pasco", dist: "Chaupimarca" };
        }

        // 19. Piura
        if (n.includes("castilla")) {
            return { dep: "Piura", prov: "Piura", dist: "Castilla" };
        }
        if (n.includes("catacaos")) {
            return { dep: "Piura", prov: "Piura", dist: "Catacaos" };
        }
        if (n.includes("la union") || n.includes("la unión")) {
            return { dep: "Piura", prov: "Piura", dist: "La Unión" };
        }
        if (n.includes("las lomas")) {
            return { dep: "Piura", prov: "Piura", dist: "Las Lomas" };
        }
        if (n.includes("tambo grande") || n.includes("tambogrande")) {
            return { dep: "Piura", prov: "Piura", dist: "Tambogrande" };
        }
        if (n.includes("veintiseis de octubre") || n.includes("veintiséis de octubre")) {
            return { dep: "Piura", prov: "Piura", dist: "Veintiséis de Octubre" };
        }
        if (n.includes("ayabaca")) {
            return { dep: "Piura", prov: "Ayabaca", dist: "Ayabaca" };
        }
        if (n.includes("paimas")) {
            return { dep: "Piura", prov: "Ayabaca", dist: "Paimas" };
        }
        if (n.includes("huancabamba")) {
            return { dep: "Piura", prov: "Huancabamba", dist: "Huancabamba" };
        }
        if (n.includes("chulucanas")) {
            return { dep: "Piura", prov: "Morropón", dist: "Chulucanas" };
        }
        if (n.includes("morropon") || n.includes("morropón")) {
            return { dep: "Piura", prov: "Morropón", dist: "Morropón" };
        }
        if (n.includes("paita")) {
            return { dep: "Piura", prov: "Paita", dist: "Paita" };
        }
        if (n.includes("sullana") || n.includes("ignacio escudero")) {
            let d = "Sullana";
            if (n.includes("ignacio escudero")) d = "Ignacio Escudero";
            else if (n.includes("bellavista")) d = "Bellavista";
            return { dep: "Piura", prov: "Sullana", dist: d };
        }
        if (n.includes("talara") || n.includes("el alto") || n.includes("organos") || n.includes("óganos") || n.includes("mancora") || n.includes("máncora")) {
            let d = "Pariñas";
            if (n.includes("el alto")) d = "El Alto";
            else if (n.includes("organos") || n.includes("órganos")) d = "Los Órganos";
            else if (n.includes("mancora") || n.includes("máncora")) d = "Máncora";
            return { dep: "Piura", prov: "Talara", dist: d };
        }
        if (n.includes("sechura")) {
            return { dep: "Piura", prov: "Sechura", dist: "Sechura" };
        }
        if (n.includes("piura")) {
            return { dep: "Piura", prov: "Piura", dist: "Piura" };
        }

        // 20. Puno
        if (n.includes("azangaro") || n.includes("azángaro")) {
            return { dep: "Puno", prov: "Azángaro", dist: "Azángaro" };
        }
        if (n.includes("desaguadero")) {
            return { dep: "Puno", prov: "Chucuito", dist: "Desaguadero" };
        }
        if (n.includes("ilave")) {
            return { dep: "Puno", prov: "El Collao", dist: "Ilave" };
        }
        if (n.includes("ayaviri")) {
            return { dep: "Puno", prov: "Melgar", dist: "Ayaviri" };
        }
        if (n.includes("juliaca")) {
            return { dep: "Puno", prov: "San Román", dist: "Juliaca" };
        }
        if (n.includes("puno")) {
            return { dep: "Puno", prov: "Puno", dist: "Puno" };
        }

        // 21. San Martín
        if (n.includes("soritor")) {
            return { dep: "San Martín", prov: "Moyobamba", dist: "Soritor" };
        }
        if (n.includes("bellavista san martin") || n.includes("bellavista san martín")) {
            return { dep: "San Martín", prov: "Bellavista", dist: "Bellavista" };
        }
        if (n.includes("sisa")) {
            return { dep: "San Martín", prov: "El Dorado", dist: "San José de Sisa" };
        }
        if (n.includes("saposoa")) {
            return { dep: "San Martín", prov: "Huallaga", dist: "Saposoa" };
        }
        if (n.includes("lamas")) {
            return { dep: "San Martín", prov: "Lamas", dist: "Lamas" };
        }
        if (n.includes("juanjuí") || n.includes("juanjui")) {
            return { dep: "San Martín", prov: "Mariscal Cáceres", dist: "Juanjuí" };
        }
        if (n.includes("picota")) {
            return { dep: "San Martín", prov: "Picota", dist: "Picota" };
        }
        if (n.includes("rioja") || n.includes("segunda jerusalen") || n.includes("nueva cajamarca") || n.includes("naranjos")) {
            let d = "Rioja";
            if (n.includes("segunda")) d = "Elias Sopoín Rivas";
            else if (n.includes("nueva cajamarca")) d = "Nueva Cajamarca";
            else if (n.includes("naranjos")) d = "Pardo Miguel";
            return { dep: "San Martín", prov: "Rioja", dist: d };
        }
        if (n.includes("tarapoto") || n.includes("banda de shilcayo") || n.includes("morales")) {
            let d = "Tarapoto";
            if (n.includes("banda")) d = "La Banda de Shilcayo";
            else if (n.includes("morales")) d = "Morales";
            return { dep: "San Martín", prov: "San Martín", dist: d };
        }
        if (n.includes("tocache") || n.includes("uchiza")) {
            return { dep: "San Martín", prov: "Tocache", dist: n.includes("uchiza") ? "Uchiza" : "Tocache" };
        }
        if (n.includes("moyobamba")) {
            return { dep: "San Martín", prov: "Moyobamba", dist: "Moyobamba" };
        }

        // 22. Tacna
        if (n.includes("pocollay")) {
            return { dep: "Tacna", prov: "Tacna", dist: "Pocollay" };
        }
        if (n.includes("ciudad nueva")) {
            return { dep: "Tacna", prov: "Tacna", dist: "Ciudad Nueva" };
        }
        if (n.includes("gregorio albarracín") || n.includes("gregorio albarracin")) {
            return { dep: "Tacna", prov: "Tacna", dist: "Coronel Gregorio Albarracín" };
        }
        if (n.includes("tacna")) {
            return { dep: "Tacna", prov: "Tacna", dist: "Tacna" };
        }

        // 23. Tumbes
        if (n.includes("corrales")) {
            return { dep: "Tumbes", prov: "Tumbes", dist: "Corrales" };
        }
        if (n.includes("la cruz")) {
            return { dep: "Tumbes", prov: "Tumbes", dist: "La Cruz" };
        }
        if (n.includes("zorritos")) {
            return { dep: "Tumbes", prov: "Contralmirante Villar", dist: "Zorritos" };
        }
        if (n.includes("zarumilla") || n.includes("aguas verdes")) {
            return { dep: "Tumbes", prov: "Zarumilla", dist: n.includes("aguas verdes") ? "Aguas Verdes" : "Zarumilla" };
        }
        if (n.includes("tumbes") || n.includes("pampa grande")) {
            return { dep: "Tumbes", prov: "Tumbes", dist: "Tumbes" };
        }

        // 24. Ucayali
        if (n.includes("calleria") || n.includes("callería")) {
            return { dep: "Ucayali", prov: "Coronel Portillo", dist: "Callería" };
        }
        if (n.includes("yarinacocha")) {
            return { dep: "Ucayali", prov: "Coronel Portillo", dist: "Yarinacocha" };
        }
        if (n.includes("manantay")) {
            return { dep: "Ucayali", prov: "Coronel Portillo", dist: "Manantay" };
        }
        if (n.includes("aguaytía") || n.includes("aguaytia")) {
            return { dep: "Ucayali", prov: "Padre Abad", dist: "Padre Abad" };
        }
        if (n.includes("pucallpa")) {
            return { dep: "Ucayali", prov: "Coronel Portillo", dist: "Callería" };
        }

        // 25. Lima (Default / Fallback)
        if (n.includes("ancon") || n.includes("ancón")) {
            return { dep: "Lima", prov: "Lima", dist: "Ancón" };
        }
        if (n.includes("ate") || n.includes("huaycan") || n.includes("huaycán") || n.includes("santa clara")) {
            return { dep: "Lima", prov: "Lima", dist: "Ate" };
        }
        if (n.includes("breña")) {
            return { dep: "Lima", prov: "Lima", dist: "Breña" };
        }
        if (n.includes("carabayllo")) {
            return { dep: "Lima", prov: "Lima", dist: "Carabayllo" };
        }
        if (n.includes("chorrillos")) {
            return { dep: "Lima", prov: "Lima", dist: "Chorrillos" };
        }
        if (n.includes("cieneguilla")) {
            return { dep: "Lima", prov: "Lima", dist: "Cieneguilla" };
        }
        if (n.includes("comas")) {
            return { dep: "Lima", prov: "Lima", dist: "Comas" };
        }
        if (n.includes("el agustino")) {
            return { dep: "Lima", prov: "Lima", dist: "El Agustino" };
        }
        if (n.includes("independencia")) {
            return { dep: "Lima", prov: "Lima", dist: "Independencia" };
        }
        if (n.includes("jesus maria") || n.includes("jesús maría") || n.includes("salaverry")) {
            return { dep: "Lima", prov: "Lima", dist: "Jesús María" };
        }
        if (n.includes("la molina")) {
            return { dep: "Lima", prov: "Lima", dist: "La Molina" };
        }
        if (n.includes("la victoria")) {
            return { dep: "Lima", prov: "Lima", dist: "La Victoria" };
        }
        if (n.includes("lince")) {
            return { dep: "Lima", prov: "Lima", dist: "Lince" };
        }
        if (n.includes("los olivos")) {
            return { dep: "Lima", prov: "Lima", dist: "Los Olivos" };
        }
        if (n.includes("lurigancho") || n.includes("huachipa")) {
            return { dep: "Lima", prov: "Lima", dist: "Lurigancho-Chosica" };
        }
        if (n.includes("lurin") || n.includes("lurín")) {
            return { dep: "Lima", prov: "Lima", dist: "Lurín" };
        }
        if (n.includes("magdalena")) {
            return { dep: "Lima", prov: "Lima", dist: "Magdalena del Mar" };
        }
        if (n.includes("san miguel")) {
            return { dep: "Lima", prov: "Lima", dist: "San Miguel" };
        }
        if (n.includes("pueblo libre")) {
            return { dep: "Lima", prov: "Lima", dist: "Pueblo Libre" };
        }
        if (n.includes("miraflores")) {
            return { dep: "Lima", prov: "Lima", dist: "Miraflores" };
        }
        if (n.includes("pachacamac") || n.includes("manchay") || n.includes("pachacámac")) {
            return { dep: "Lima", prov: "Lima", dist: "Pachacámac" };
        }
        if (n.includes("pucusana")) {
            return { dep: "Lima", prov: "Lima", dist: "Pucusana" };
        }
        if (n.includes("puente piedra")) {
            return { dep: "Lima", prov: "Lima", dist: "Puente Piedra" };
        }
        if (n.includes("punta hermosa")) {
            return { dep: "Lima", prov: "Lima", dist: "Punta Hermosa" };
        }
        if (n.includes("rimac") || n.includes("rímac")) {
            return { dep: "Lima", prov: "Lima", dist: "Rímac" };
        }
        if (n.includes("san borja")) {
            return { dep: "Lima", prov: "Lima", dist: "San Borja" };
        }
        if (n.includes("san juan de lurigancho")) {
            return { dep: "Lima", prov: "Lima", dist: "San Juan de Lurigancho" };
        }
        if (n.includes("san juan de miraflores")) {
            return { dep: "Lima", prov: "Lima", dist: "San Juan de Miraflores" };
        }
        if (n.includes("san martin de porres") || n.includes("san martín de porres")) {
            return { dep: "Lima", prov: "Lima", dist: "San Martín de Porres" };
        }
        if (n.includes("santa anita")) {
            return { dep: "Lima", prov: "Lima", dist: "Santa Anita" };
        }
        if (n.includes("santa rosa")) {
            return { dep: "Lima", prov: "Lima", dist: "Santa Rosa" };
        }
        if (n.includes("surco") || n.includes("santiago de surco")) {
            return { dep: "Lima", prov: "Lima", dist: "Santiago de Surco" };
        }
        if (n.includes("surquillo")) {
            return { dep: "Lima", prov: "Lima", dist: "Surquillo" };
        }
        if (n.includes("villa el salvador")) {
            return { dep: "Lima", prov: "Lima", dist: "Villa El Salvador" };
        }
        if (n.includes("villa maria del triunfo") || n.includes("villa maría del triunfo")) {
            return { dep: "Lima", prov: "Lima", dist: "Villa María del Triunfo" };
        }
        if (n.includes("barranca") || n.includes("paramonga") || n.includes("supe")) {
            let d = "Barranca";
            if (n.includes("paramonga")) d = "Paramonga";
            else if (n.includes("supe")) d = "Supe";
            return { dep: "Lima", prov: "Barranca", dist: d };
        }
        if (n.includes("cañete") || n.includes("imperial") || n.includes("mala")) {
            let d = "San Vicente de Cañete";
            if (n.includes("imperial")) d = "Imperial";
            else if (n.includes("mala")) d = "Mala";
            return { dep: "Lima", prov: "Cañete", dist: d };
        }
        if (n.includes("huaral") || n.includes("chancay")) {
            return { dep: "Lima", prov: "Huaral", dist: n.includes("chancay") ? "Chancay" : "Huaral" };
        }
        if (n.includes("jicamarca")) {
            return { dep: "Lima", prov: "Huarochirí", dist: "San Antonio" };
        }
        if (n.includes("huacho") || n.includes("huaura") || n.includes("sayan") || n.includes("sayán")) {
            let d = "Huaura";
            if (n.includes("sayán") || n.includes("sayan")) d = "Sayán";
            else if (n.includes("huacho")) d = "Huacho";
            return { dep: "Lima", prov: "Huaura", dist: d };
        }

        return { dep: "Otros", prov: "Otros", dist: "Otros" };
    }

    function getShalomRegions(rawText) {
        const regions = {};
        const lines = rawText.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('-')) {
                line = line.substring(1).trim();
            }
            if (!line) continue;
            
            const match = line.match(/^([^(]+)\(([^)]+)\)$/);
            if (match) {
                const name = match[1].trim();
                const details = match[2].trim();
                
                let address = details;
                let reference = "";
                
                const refIndex = details.search(/,?\s*Ref[\.:]\s*/i);
                if (refIndex !== -1) {
                    address = details.substring(0, refIndex).trim();
                    const refMatch = details.substring(refIndex).match(/Ref[\.:]\s*(.+)$/i);
                    if (refMatch) {
                        reference = refMatch[1].trim();
                    }
                }
                
                const { dep, prov, dist } = classifyAgency(name, address);
                
                if (!regions[dep]) regions[dep] = {};
                if (!regions[dep][prov]) regions[dep][prov] = {};
                if (!regions[dep][prov][dist]) regions[dep][prov][dist] = [];
                
                regions[dep][prov][dist].push({
                    name: name,
                    address: address,
                    reference: reference
                });
            }
        }
        return regions;
    }

    const SHALOM_REGIONS = getShalomRegions(RAW_SHALOM_DATA);

    let selectedShippingMethod = 'Shalom';
    let currentOrderSubtotal = 0;

    const updateShippingPrice = () => {
        const feeVal = selectedShippingMethod === 'Delivery' ? 15.00 : 0.00;
        const totalVal = currentOrderSubtotal + feeVal;
        
        const feeElement = document.getElementById('shipping-fee-val');
        const totalElement = document.getElementById('shipping-total');
        if (feeElement) {
            feeElement.textContent = selectedShippingMethod === 'Delivery' ? 'S/15.00' : 'S/0.00 (Pago en Destino)';
        }
        if (totalElement) {
            totalElement.textContent = `S/${totalVal.toFixed(2)}`;
        }
    };

    const injectShippingModal = () => {
        if (document.getElementById('shipping-modal')) return;

        const modalHTML = `
        <div id="shipping-modal" class="fixed inset-0 z-[150] overflow-y-auto bg-slate-900/60 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row transform translate-y-4 transition-all duration-300 max-h-[95vh] md:max-h-[85vh] relative text-slate-800 dark:text-slate-100">
                
                <!-- Botón de Cerrar -->
                <button id="close-shipping-btn" class="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 hover:border-black dark:hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-20 bg-white dark:bg-slate-800" aria-label="Cerrar modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <!-- PANEL IZQUIERDO: Resumen -->
                <div class="w-full md:w-5/12 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[35vh] md:max-h-none">
                    <div>
                        <div class="flex items-center gap-3 mb-6">
                            <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" width="30" height="33" viewBox="0 0 30 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="m8 4.55 6.75 3.884 6.75-3.885M8 27.83v-7.755L1.25 16.19m27 0-6.75 3.885v7.754M1.655 8.658l13.095 7.546 13.095-7.546M14.75 31.25V16.189m13.5 5.976V10.212a2.98 2.98 0 0 0-1.5-2.585L16.25 1.65a3.01 3.01 0 0 0-3 0L2.75 7.627a3 3 0 0 0-1.5 2.585v11.953a2.98 2.98 0 0 0 1.5 2.585l10.5 5.977a3.01 3.01 0 0 0 3 0l10.5-5.977a3 3 0 0 0 1.5-2.585" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span class="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white">Llamala Store</span>
                        </div>

                        <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Resumen del Pedido</h3>
                        <div id="shipping-items-list" class="space-y-4 max-h-[150px] md:max-h-[250px] overflow-y-auto pr-1"></div>
                    </div>

                    <div class="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span class="font-semibold text-gray-800 dark:text-slate-200" id="shipping-subtotal">S/0.00</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Costo de Envío</span>
                            <span class="font-semibold text-gray-800 dark:text-slate-200" id="shipping-fee-val">S/0.00</span>
                        </div>
                        <div class="flex justify-between text-base font-bold pt-2 border-t border-slate-100 dark:border-slate-900">
                            <span class="text-gray-900 dark:text-white">Total</span>
                            <span class="text-indigo-600 dark:text-indigo-400 text-lg font-black" id="shipping-total">S/0.00</span>
                        </div>
                    </div>
                </div>

                <!-- PANEL DERECHO -->
                <div class="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-none">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 text-left">Método de Despacho</h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 text-left">Selecciona cómo deseas recibir tus productos para continuar al pago.</p>

                        <!-- Dos opciones -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            
                            <!-- Opción 1: Delivery -->
                            <div id="option-delivery-card" class="shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-gray-200">
                                <div class="flex items-start justify-between">
                                    <div class="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                    </div>
                                    <span class="px-2.5 py-1 text-[11px] font-black rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">S/ 15.00</span>
                                </div>
                                <div class="mt-4">
                                    <h4 class="text-sm font-bold text-gray-900 dark:text-white">Delivery a Domicilio</h4>
                                    <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5" id="delivery-status-msg">Dirección Registrada.</p>
                                </div>
                            </div>

                            <!-- Opción 2: Shalom -->
                            <div id="option-shalom-card" class="shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-indigo-600">
                                <div class="flex items-start justify-between">
                                    <div class="p-2 bg-lime-50 dark:bg-lime-950/20 text-lime-600 dark:text-lime-400 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="1" y="3" width="15" height="13"></rect>
                                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                        </svg>
                                    </div>
                                    <span class="px-2.5 py-1 text-[11px] font-black rounded-lg bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300">Pago en Destino</span>
                                </div>
                                <div class="mt-4">
                                    <h4 class="text-sm font-bold text-gray-900 dark:text-white">Agencia Shalom</h4>
                                    <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Recojo en agencia.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Formularios correspondientes -->
                        <div id="shipping-forms-container" class="space-y-4 text-left">
                            
                            <!-- Delivery Form -->
                            <div id="form-delivery-container" class="space-y-4 hidden">
                                <div class="p-4 rounded-2xl bg-indigo-50/20 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-slate-800 space-y-2">
                                    <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Dirección Registrada</h4>
                                    <div class="space-y-1">
                                        <p class="text-sm font-bold text-gray-900 dark:text-white" id="delivery-address-text">-</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400" id="delivery-city-text">-</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400" id="delivery-phone-text">-</p>
                                    </div>
                                </div>
                                <div class="flex flex-col">
                                    <label for="shipping-references" class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Referencias de Entrega (Opcional)</label>
                                    <input id="shipping-references" placeholder="Ej: Portón negro, frente al parque, timbre de bronce" class="shipping-input mt-1.5 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-sans font-medium" type="text">
                                </div>
                            </div>

                            <!-- Shalom Form -->
                            <div id="form-shalom-container" class="space-y-4">
                                <div class="bg-amber-55/30 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-2xl p-4 flex gap-3 items-start">
                                    <div class="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                    </div>
                                    <p class="text-[11px] text-amber-850 dark:text-amber-300 leading-relaxed font-medium">Recojo en agencia. Pago en Destino (Cancelas el costo de envío al recoger tu producto).</p>
                                </div>

                                <!-- Datos de contacto para invitados si no están logueados -->
                                <div id="guest-contact-container" class="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 space-y-3 hidden">
                                    <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Datos de Contacto (Invitado)</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div class="flex flex-col">
                                            <label for="guest-name" class="font-bold text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nombre Completo</label>
                                            <input id="guest-name" placeholder="Ej: Juan Perez" class="shipping-input mt-1.5 rounded-lg border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-3 py-2 w-full text-xs text-gray-900 dark:text-white" type="text">
                                        </div>
                                        <div class="flex flex-col">
                                            <label for="guest-email" class="font-bold text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Correo Electrónico</label>
                                            <input id="guest-email" placeholder="email@ejemplo.com" class="shipping-input mt-1.5 rounded-lg border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-3 py-2 w-full text-xs text-gray-900 dark:text-white" type="email">
                                        </div>
                                    </div>
                                    <div class="flex flex-col">
                                        <label for="guest-phone" class="font-bold text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Teléfono de Contacto</label>
                                        <input id="guest-phone" placeholder="Ej: 987654321" class="shipping-input mt-1.5 rounded-lg border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-3 py-2 w-full text-xs text-gray-900 dark:text-white" type="text">
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="flex flex-col">
                                        <label for="shalom-departamento" class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Departamento</label>
                                        <select id="shalom-departamento" class="shipping-select mt-1.5 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-medium">
                                            <option value="" disabled selected>Selecciona Departamento</option>
                                        </select>
                                    </div>
                                    <div class="flex flex-col">
                                        <label for="shalom-provincia" class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Provincia</label>
                                        <select id="shalom-provincia" disabled class="shipping-select mt-1.5 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-medium">
                                            <option value="" disabled selected>Selecciona Provincia</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="flex flex-col">
                                        <label for="shalom-distrito" class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Distrito</label>
                                        <select id="shalom-distrito" disabled class="shipping-select mt-1.5 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-medium">
                                            <option value="" disabled selected>Selecciona Distrito</option>
                                        </select>
                                    </div>
                                    <div class="flex flex-col">
                                        <label for="shalom-agencia" class="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Agencia Shalom</label>
                                        <select id="shalom-agencia" disabled class="shipping-select mt-1.5 rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-950 px-4 py-3 w-full transition text-sm text-gray-900 dark:text-white font-medium">
                                            <option value="" disabled selected>Selecciona Agencia</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Detalle de Agencia Seleccionada -->
                                <div id="shalom-agencia-detalle" class="hidden p-4 rounded-2xl bg-indigo-50/10 dark:bg-slate-950/30 border border-indigo-100/30 dark:border-slate-850 space-y-1.5 text-left transition-all duration-300">
                                    <p class="text-xs font-bold text-gray-900 dark:text-white" id="shalom-det-nombre"></p>
                                    <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium" id="shalom-det-direccion"></p>
                                    <p class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold" id="shalom-det-referencia"></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button id="confirm-shipping-btn" type="button" class="mt-6 py-3.5 w-full cursor-pointer rounded-xl bg-indigo-600 text-white font-bold transition hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2">
                        Confirmar y Continuar al Pago
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>

            </div>
        </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);
        
        // Wire up close events
        const modal = document.getElementById('shipping-modal');
        const card = modal.querySelector('div');
        
        const closeShipping = () => {
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
        
        document.getElementById('close-shipping-btn').onclick = (e) => {
            e.preventDefault();
            closeShipping();
        };

        modal.onclick = (e) => {
            if (e.target === modal) closeShipping();
        };
        
        // Wire up tab option clicks
        const optDelivery = document.getElementById('option-delivery-card');
        const optShalom = document.getElementById('option-shalom-card');
        const formDelivery = document.getElementById('form-delivery-container');
        const formShalom = document.getElementById('form-shalom-container');
        
        const selectMethod = (method) => {
            selectedShippingMethod = method;
            if (method === 'Delivery') {
                optDelivery.className = "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-indigo-600";
                optShalom.className = "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-gray-200";
                formDelivery.classList.remove('hidden');
                formShalom.classList.add('hidden');
            } else {
                optShalom.className = "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-indigo-600";
                optDelivery.className = optDelivery.classList.contains('shipping-card-disabled')
                    ? "shipping-card-radio shipping-card-disabled p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-gray-200"
                    : "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-gray-200";
                formShalom.classList.remove('hidden');
                formDelivery.classList.add('hidden');
            }
            updateShippingPrice();
        };

        optDelivery.onclick = () => {
            if (!optDelivery.classList.contains('shipping-card-disabled')) {
                selectMethod('Delivery');
            }
        };

        optShalom.onclick = () => {
            selectMethod('Shalom');
        };

        // Wire up Shalom Cascading Selects
        const selectDept = document.getElementById('shalom-departamento');
        const selectProv = document.getElementById('shalom-provincia');
        const selectDist = document.getElementById('shalom-distrito');
        const selectAgencia = document.getElementById('shalom-agencia');
        const detailContainer = document.getElementById('shalom-agencia-detalle');

        // Populate departments
        selectDept.innerHTML = '<option value="" disabled selected>Selecciona Departamento</option>';
        Object.keys(SHALOM_REGIONS).sort().forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept;
            opt.textContent = dept;
            selectDept.appendChild(opt);
        });

        selectDept.onchange = () => {
            selectProv.innerHTML = '<option value="" disabled selected>Selecciona Provincia</option>';
            selectProv.disabled = true;
            selectDist.innerHTML = '<option value="" disabled selected>Selecciona Distrito</option>';
            selectDist.disabled = true;
            selectAgencia.innerHTML = '<option value="" disabled selected>Selecciona Agencia</option>';
            selectAgencia.disabled = true;
            detailContainer.classList.add('hidden');

            const val = selectDept.value;
            if (val && SHALOM_REGIONS[val]) {
                selectProv.disabled = false;
                Object.keys(SHALOM_REGIONS[val]).sort().forEach(prov => {
                    const opt = document.createElement('option');
                    opt.value = prov;
                    opt.textContent = prov;
                    selectProv.appendChild(opt);
                });
            }
        };

        selectProv.onchange = () => {
            selectDist.innerHTML = '<option value="" disabled selected>Selecciona Distrito</option>';
            selectDist.disabled = true;
            selectAgencia.innerHTML = '<option value="" disabled selected>Selecciona Agencia</option>';
            selectAgencia.disabled = true;
            detailContainer.classList.add('hidden');

            const dept = selectDept.value;
            const prov = selectProv.value;
            if (dept && prov && SHALOM_REGIONS[dept][prov]) {
                selectDist.disabled = false;
                Object.keys(SHALOM_REGIONS[dept][prov]).sort().forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist;
                    opt.textContent = dist;
                    selectDist.appendChild(opt);
                });
            }
        };

        selectDist.onchange = () => {
            selectAgencia.innerHTML = '<option value="" disabled selected>Selecciona Agencia</option>';
            selectAgencia.disabled = true;
            detailContainer.classList.add('hidden');

            const dept = selectDept.value;
            const prov = selectProv.value;
            const dist = selectDist.value;
            if (dept && prov && dist && SHALOM_REGIONS[dept][prov][dist]) {
                selectAgencia.disabled = false;
                SHALOM_REGIONS[dept][prov][dist].sort((a,b) => a.name.localeCompare(b.name)).forEach((agency, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.textContent = agency.name;
                    selectAgencia.appendChild(opt);
                });
            }
        };

        selectAgencia.onchange = () => {
            const dept = selectDept.value;
            const prov = selectProv.value;
            const dist = selectDist.value;
            const idx = selectAgencia.value;
            
            if (dept && prov && dist && idx !== "" && SHALOM_REGIONS[dept][prov][dist][idx]) {
                const agency = SHALOM_REGIONS[dept][prov][dist][idx];
                document.getElementById('shalom-det-nombre').textContent = agency.name;
                document.getElementById('shalom-det-direccion').textContent = `Dirección: ${agency.address}`;
                document.getElementById('shalom-det-referencia').textContent = agency.reference ? `Ref: ${agency.reference}` : '';
                detailContainer.classList.remove('hidden');
            } else {
                detailContainer.classList.add('hidden');
            }
        };
    };

    const openShippingModal = (orderData) => {
        injectShippingModal();
        const modal = document.getElementById('shipping-modal');
        const card = modal.querySelector('div');
        
        // Populate items in left summary
        const listContainer = document.getElementById('shipping-items-list');
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

        // Store subtotal
        currentOrderSubtotal = orderData.total;
        document.getElementById('shipping-subtotal').textContent = `S/${currentOrderSubtotal.toFixed(2)}`;
        
        // Verify user login status
        const currentUser = localStorage.getItem('dummy_user');
        const optDelivery = document.getElementById('option-delivery-card');
        const statusMsg = document.getElementById('delivery-status-msg');
        const detailContainer = document.getElementById('shalom-agencia-detalle');
        
        // Reset selections
        document.getElementById('shipping-references').value = '';
        document.getElementById('guest-name').value = '';
        document.getElementById('guest-email').value = '';
        document.getElementById('guest-phone').value = '';
        
        // Reset cascades
        document.getElementById('shalom-departamento').value = '';
        const selectProv = document.getElementById('shalom-provincia');
        selectProv.innerHTML = '<option value="" disabled selected>Selecciona Provincia</option>';
        selectProv.disabled = true;
        const selectDist = document.getElementById('shalom-distrito');
        selectDist.innerHTML = '<option value="" disabled selected>Selecciona Distrito</option>';
        selectDist.disabled = true;
        const selectAgencia = document.getElementById('shalom-agencia');
        selectAgencia.innerHTML = '<option value="" disabled selected>Selecciona Agencia</option>';
        selectAgencia.disabled = true;
        detailContainer.classList.add('hidden');

        if (currentUser) {
            const user = JSON.parse(currentUser);
            optDelivery.classList.remove('shipping-card-disabled');
            statusMsg.innerHTML = 'Entrega rápida a tu dirección registrada.';
            
            document.getElementById('delivery-address-text').textContent = user.address || 'Sin dirección registrada';
            document.getElementById('delivery-city-text').textContent = `${user.city || 'Sin ciudad'}, ${user.province || ''}`;
            document.getElementById('delivery-phone-text').textContent = user.phone || 'Sin teléfono';
            
            document.getElementById('guest-contact-container').classList.add('hidden');
            
            // Default select Delivery
            selectedShippingMethod = 'Delivery';
            optDelivery.className = "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-indigo-600";
            document.getElementById('option-shalom-card').className = "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-gray-200";
            document.getElementById('form-delivery-container').classList.remove('hidden');
            document.getElementById('form-shalom-container').classList.add('hidden');
        } else {
            optDelivery.classList.add('shipping-card-disabled');
            statusMsg.innerHTML = `
                Dirección Registrada.<br>
                <a href="#" id="shipping-login-btn" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Inicia sesión</a> para usar tus direcciones.
            `;
            
            // Handle shipping login click
            setTimeout(() => {
                const loginLink = document.getElementById('shipping-login-btn');
                if (loginLink) {
                    loginLink.onclick = (e) => {
                        e.preventDefault();
                        // Close shipping
                        const closeBtn = document.getElementById('close-shipping-btn');
                        if (closeBtn) closeBtn.click();
                        
                        // Open login modal
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) {
                            loginModal.classList.remove('hidden');
                            loginModal.classList.add('flex');
                            setTimeout(() => {
                                loginModal.classList.remove('opacity-0');
                                loginModal.classList.add('opacity-100');
                            }, 10);
                        }
                    };
                }
            }, 50);

            document.getElementById('guest-contact-container').classList.remove('hidden');
            
            // Default select Shalom
            selectedShippingMethod = 'Shalom';
            document.getElementById('option-shalom-card').className = "shipping-card-radio p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-indigo-600";
            optDelivery.className = "shipping-card-radio shipping-card-disabled p-4 rounded-2xl border-2 flex flex-col text-left justify-between h-36 border-gray-200";
            document.getElementById('form-delivery-container').classList.add('hidden');
            document.getElementById('form-shalom-container').classList.remove('hidden');
        }

        updateShippingPrice();

        // Animate Open
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

        // Submit/Confirm Handler
        document.getElementById('confirm-shipping-btn').onclick = (e) => {
            e.preventDefault();
            
            let guestData = null;
            if (!currentUser) {
                const guestName = document.getElementById('guest-name').value.trim();
                const guestEmail = document.getElementById('guest-email').value.trim();
                const guestPhone = document.getElementById('guest-phone').value.trim();
                
                if (!guestName || !guestEmail || !guestPhone) {
                    alert("Por favor completa todos los Datos de Contacto.");
                    return;
                }
                guestData = { name: guestName, email: guestEmail, phone: guestPhone };
            }

            if (selectedShippingMethod === 'Delivery') {
                const user = JSON.parse(currentUser);
                if (!user.address || user.address.trim() === '') {
                    alert("No tienes una dirección registrada. Por favor ve a 'Mi Cuenta' para configurarla.");
                    return;
                }
                
                const referencesVal = document.getElementById('shipping-references').value.trim();
                
                const updatedOrderData = {
                    ...orderData,
                    shippingMethod: 'Delivery',
                    shippingCost: 15.00,
                    total: currentOrderSubtotal + 15.00,
                    shippingAddress: {
                        address: user.address,
                        province: user.province || '',
                        city: user.city || '',
                        zip: user.zip || '',
                        phone: user.phone || '',
                        references: referencesVal
                    }
                };

                // Close and proceed
                const closeBtn = document.getElementById('close-shipping-btn');
                if (closeBtn) closeBtn.click();
                openPaymentModal(updatedOrderData);
            } else {
                const dept = document.getElementById('shalom-departamento').value;
                const prov = document.getElementById('shalom-provincia').value;
                const dist = document.getElementById('shalom-distrito').value;
                const agencyIdx = document.getElementById('shalom-agencia').value;

                if (!dept || !prov || !dist || agencyIdx === "") {
                    alert("Por favor completa todos los campos de la Agencia Shalom.");
                    return;
                }

                const agency = SHALOM_REGIONS[dept][prov][dist][agencyIdx];

                const updatedOrderData = {
                    ...orderData,
                    shippingMethod: 'Shalom',
                    shippingCost: 0.00,
                    total: currentOrderSubtotal,
                    shippingAddress: {
                        address: `Agencia Shalom: ${agency.name} (${agency.address})`,
                        province: prov,
                        city: dist,
                        zip: dept,
                        phone: currentUser ? JSON.parse(currentUser).phone : guestData.phone
                    }
                };

                if (!currentUser) {
                    updatedOrderData.userId = 'guest_' + Math.random().toString(36).substr(2, 9);
                    updatedOrderData.userEmail = guestData.email;
                    updatedOrderData.userName = guestData.name;
                }

                // Close and proceed
                const closeBtn = document.getElementById('close-shipping-btn');
                if (closeBtn) closeBtn.click();
                openPaymentModal(updatedOrderData);
            }
        };
    };


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
                            <span>Envío</span>
                            <span class="font-semibold text-gray-800 dark:text-slate-200" id="payment-shipping-val">S/0.00</span>
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
                                        <!-- Real QR Code Image -->
                                        <img src="img/qr_yape.png" alt="Código QR Yape" class="w-40 h-40 object-contain rounded-lg">
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
        const total = orderData.total;
        const discountVal = 0.00; 
        const taxVal = 0.00; // Simulado según diseño
        const shippingFee = orderData.shippingCost || 0;
        const shippingMethod = orderData.shippingMethod || '';
        document.getElementById('payment-discount').textContent = `S/${discountVal.toFixed(2)}`;
        
        const shippingElement = document.getElementById('payment-shipping-val');
        if (shippingElement) {
            shippingElement.textContent = shippingMethod === 'Shalom' ? 'S/0.00 (Shalom Destino)' : `S/${shippingFee.toFixed(2)}`;
        }
        
        document.getElementById('payment-tax').textContent = `S/${taxVal.toFixed(2)}`;
        document.getElementById('payment-total').textContent = `S/${total.toFixed(2)}`;
        
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

        // Enviar notificación de pedido a WhatsApp
        const sendWhatsAppNotification = (method, orderData) => {
            const phoneNumber = "51977507037"; // Código de país de Perú (+51)
            
            // Formatear productos
            let productsText = "";
            if (Array.isArray(orderData.items)) {
                orderData.items.forEach(item => {
                    productsText += `- ${item.name} (Cant: ${item.quantity}) - ${item.price}\n`;
                });
            }
            
            // Formatear la ubicación
            const sa = orderData.shippingAddress || {};
            let locationParts = [];
            if (sa.address) locationParts.push(sa.address);
            if (sa.city) locationParts.push(sa.city);
            if (sa.province) locationParts.push(sa.province);
            if (sa.zip) locationParts.push(sa.zip);
            
            let locationText = locationParts.join(', ');
            if (sa.references) {
                locationText += ` (Ref: ${sa.references})`;
            }
            
            // Formatear el monto total
            const totalVal = typeof orderData.total === 'number' ? orderData.total : parseFloat(orderData.total);
            const totalFormatted = !isNaN(totalVal) ? totalVal.toFixed(2) : orderData.total;
            
            // Construir el mensaje
            const message = `*NUEVO PEDIDO PROCESADO* 🛍️\n\n` +
                            `*Monto Pagado:* S/ ${totalFormatted}\n` +
                            `*Método de Pago:* ${method}\n` +
                            `*Método de Envío:* ${orderData.shippingMethod || 'No especificado'}\n` +
                            `*Ubicación/Entrega:* ${locationText}\n\n` +
                            `*Productos:*\n${productsText.trim()}`;
                            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
            
            // Redirigir la pestaña actual a WhatsApp para evitar bloqueadores de popups
            window.location.href = whatsappUrl;
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
                    alert("¡Pago simulado con éxito y pedido realizado! Redirigiendo a WhatsApp...");
                } else {
                    // Fallback local
                    let localOrders = JSON.parse(localStorage.getItem('dummy_orders')) || [];
                    const orderId = 'order_local_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                    localOrders.push({ id: orderId, paymentMethod: method, ...orderData });
                    localStorage.setItem('dummy_orders', JSON.stringify(localOrders));
                    alert("¡Pago simulado con éxito (modo local)! Redirigiendo a WhatsApp...");
                }

                // Limpiar carrito primero para que esté vacío al regresar
                localStorage.removeItem('llamala_cart');
                if (typeof window.updateCartUI === 'function') {
                    window.updateCartUI();
                }

                closePayment();

                // Enviar mensaje a WhatsApp (redirigiendo la pestaña actual)
                sendWhatsAppNotification(method, orderData);
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
                let cart = JSON.parse(localStorage.getItem('llamala_cart')) || [];
                if (cart.length === 0) {
                    alert("Tu carrito está vacío.");
                    return;
                }

                // Obtener usuario actual para pre-poblar si existe
                const currentUser = localStorage.getItem('dummy_user');
                const user = currentUser ? JSON.parse(currentUser) : null;

                const total = cart.reduce((sum, item) => {
                    const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
                    return sum + (price * item.quantity);
                }, 0);

                const orderData = {
                    userId: user ? (user.uid || user.email) : 'guest',
                    userEmail: user ? user.email : '',
                    userName: user ? (user.username || user.email.split('@')[0]) : 'Invitado',
                    items: cart,
                    total: total,
                    status: 'Pendiente',
                    createdAt: new Date().toISOString(),
                    shippingAddress: {
                        address: user ? (user.address || '') : '',
                        province: user ? (user.province || '') : '',
                        city: user ? (user.city || '') : '',
                        zip: user ? (user.zip || '') : '',
                        phone: user ? (user.phone || '') : ''
                    }
                };

                // Abrir modal de despacho en vez de proceder directamente al pago
                openShippingModal(orderData);
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
