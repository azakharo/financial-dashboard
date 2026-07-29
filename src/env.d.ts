import 'vue';

declare module 'vue' {
  interface HTMLAttributes {
    'data-testid'?: string;
    'data-slot'?: string;
    'data-variant'?: string;
    'data-size'?: string;
  }

  interface ButtonHTMLAttributes {
    'data-testid'?: string;
    'data-slot'?: string;
    'data-variant'?: string;
    'data-size'?: string;
  }

  interface InputHTMLAttributes {
    'data-testid'?: string;
    'data-slot'?: string;
    'data-variant'?: string;
    'data-size'?: string;
  }

  interface GlobalComponents {
    apexchart: (typeof import('vue3-apexcharts'))['default'];
  }
}

export {};
