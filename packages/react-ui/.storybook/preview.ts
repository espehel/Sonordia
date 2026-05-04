import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';

import '../src/styles.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: { disable: true },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  initialGlobals: {
    theme: 'light',
  },

  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        document.body.classList.add('bg-background', 'text-foreground');
        return () => {
          root.classList.remove('dark');
        };
      }, [theme]);
      return Story();
    },
  ],
};

export default preview;
