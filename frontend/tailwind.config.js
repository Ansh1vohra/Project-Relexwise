/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: '#6366F1',
                primaryLight: '#A5B4FC',
                primaryBg: '#F8FAFC',
                secondary: '#64748B',
                success: '#10B981',
                warning: '#F59E0B',
                error: '#F87171',
                textPrimary: '#1E293B',
                textSecondary: '#64748B',
                surface: '#FFFFFF',
                background: '#F8FAFC',
            },
            spacing: {
                1: '4px',
                2: '8px',
                3: '12px',
                4: '16px',
                6: '24px',
                8: '32px',
                12: '48px',
                16: '64px',
            },
            transitionTimingFunction: {
                'ease-saas': 'cubic-bezier(0.2, 0, 0, 1)',
            },
            transitionDuration: {
                200: '200ms',
            },
            boxShadow: {
                glass: '0 4px 30px rgba(0,0,0,0.1)',
                card: '0 1px 3px rgba(0, 0, 0, 0.05)',
                cardHover: '0 4px 12px rgba(0, 0, 0, 0.05)',
                elevation: '0 10px 25px rgba(0, 0, 0, 0.05)',
            },
            backdropBlur: {
                xs: '2px',
            },
            borderRadius: {
                sm: '8px',
                md: '12px',
                lg: '16px',
                xl: '24px',
            },
            fontSize: {
                h1: ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
                h2: ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
                h3: ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
                bodyLg: ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
                body: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
                bodySm: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
                caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
            },
        },
    },
    plugins: [],
};
