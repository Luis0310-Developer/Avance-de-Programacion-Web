// Configurar Tailwind CSS CDN para usar modo oscuro basado en clase
window.tailwind = window.tailwind || {};
window.tailwind.config = window.tailwind.config || {};
window.tailwind.config.darkMode = 'class';

// Aplicar el tema guardado inmediatamente para evitar parpadeo blanco (FOUC)
(function () {
    const savedTheme = localStorage.getItem('llamala_theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

// Inyectar el botón flotante de cambio de tema una vez cargado el DOM
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle-btn';
    toggleBtn.className = 'fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-full shadow-2xl flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none';
    toggleBtn.setAttribute('aria-label', 'Cambiar tema de color');
    
    // Iconos SVG de luna y sol incorporados
    toggleBtn.innerHTML = `
        <!-- Icono de Luna (Se muestra en tema Claro para cambiar a Oscuro) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon-moon w-6 h-6 transition-transform duration-300 hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <!-- Icono de Sol (Se muestra en tema Oscuro para cambiar a Claro) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon-sun w-6 h-6 transition-transform duration-500 hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
    `;
    
    document.body.appendChild(toggleBtn);
    
    // Evento de clic para cambiar de tema
    toggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('llamala_theme', isDark ? 'dark' : 'light');
    });
});
