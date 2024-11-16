import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebContainer');

interface WebContainerContext {
  loaded: boolean;
  error?: string;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr2
});

if (!import.meta.env.SSR) {
  logger.debug('Initializing WebContainer...');
  console.log('Initializing WebContainer...');

  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        logger.debug('Booting WebContainer...');
        console.log('Booting WebContainer...');
        return WebContainer.boot({ workdirName: WORK_DIR_NAME });
      })
      .then((webcontainer) => {
        logger.debug('WebContainer booted successfully');
        console.log('WebContainer booted successfully');
        webcontainerContext.loaded = true;
        webcontainerContext.error = undefined;
        return webcontainer;
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Failed to initialize WebContainer:', errorMessage);
        console.error('Failed to initialize WebContainer:', errorMessage);
        webcontainerContext.error = errorMessage;
        throw error;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}

// Helper function to check WebContainer status
export async function getWebContainerStatus(): Promise<{ loaded: boolean; error?: string }> {
  try {
    await webcontainer;
    return { loaded: webcontainerContext.loaded };
  } catch (error) {
    return { 
      loaded: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
