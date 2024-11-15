import { webcontainer, webcontainerContext, getWebContainerStatus } from '~/lib/webcontainer';
import { WORK_DIR } from './constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHub');

interface GitHubFileContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  url: string;
  content?: string;
  encoding?: string;
  size?: number;
}

export async function setupGitHubProject(username: string, repo: string) {
  logger.debug('Checking WebContainer status...');
  console.log('Checking WebContainer status...');
  
  // Check WebContainer status
  const status = await getWebContainerStatus();
  if (!status.loaded) {
    const error = `WebContainer not ready: ${status.error || 'Unknown error'}`;
    logger.error(error);
    console.error(error);
    throw new Error(error);
  }
  
  logger.debug('WebContainer ready, proceeding with setup');
  console.log('WebContainer ready, proceeding with setup');
  const instance = await webcontainer;
  
  logger.debug(`Setting up GitHub project: ${username}/${repo}`);
  console.log(`Setting up GitHub project: ${username}/${repo}`);
  
  // Clear any existing files in the work directory
  logger.debug(`Clearing work directory: ${WORK_DIR}`);
  console.log(`Clearing work directory: ${WORK_DIR}`);
  try {
    await instance.fs.rm(WORK_DIR, { recursive: true, force: true });
    await instance.fs.mkdir(WORK_DIR, { recursive: true });
  } catch (error) {
    logger.error('Error clearing work directory:', error);
    console.error('Error clearing work directory:', error);
    throw error;
  }

  // Function to recursively fetch and write files
  async function processEntry(path: string): Promise<void> {
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    logger.debug(`Fetching contents from: ${apiUrl}`);
    console.log(`Fetching contents from: ${apiUrl}`);
    
    // Fetch content info from GitHub API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${import.meta.env.VITE_GITHUB_TOKEN}`
      }
    });

    if (!response.ok) {
      const error = `Failed to fetch ${path}: ${response.status} ${response.statusText}`;
      logger.error(error);
      console.error(error);
      throw new Error(error);
    }

    const data = await response.json();
    const entries = Array.isArray(data) ? data : [data];
    logger.debug(`Processing ${entries.length} entries from ${path || 'root'}`);
    console.log(`Processing ${entries.length} entries from ${path || 'root'}`);

    for (const entry of entries) {
      const fullPath = `${WORK_DIR}/${entry.path}`;
      logger.debug(`Processing entry: ${entry.path} (${entry.type})`);
      console.log(`Processing entry: ${entry.path} (${entry.type})`);

      if (entry.type === 'dir') {
        // Create directory and process its contents
        logger.debug(`Creating directory: ${fullPath}`);
        console.log(`Creating directory: ${fullPath}`);
        try {
          await instance.fs.mkdir(fullPath, { recursive: true });
          await processEntry(entry.path);
        } catch (error) {
          logger.error(`Error processing directory ${entry.path}:`, error);
          console.error(`Error processing directory ${entry.path}:`, error);
          throw error;
        }
      } else if (entry.type === 'file') {
        // Create parent directories if they don't exist
        const dirPath = fullPath.split('/').slice(0, -1).join('/');
        logger.debug(`Ensuring directory exists: ${dirPath}`);
        console.log(`Ensuring directory exists: ${dirPath}`);
        try {
          await instance.fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
          logger.error(`Error creating directory ${dirPath}:`, error);
          console.error(`Error creating directory ${dirPath}:`, error);
          throw error;
        }

        let content: string;
        try {
          if (entry.encoding === 'base64' && entry.content) {
            logger.debug(`Decoding base64 content for: ${entry.path}`);
            console.log(`Decoding base64 content for: ${entry.path}`);
            content = atob(entry.content);
          } else if (entry.download_url) {
            logger.debug(`Fetching content from: ${entry.download_url}`);
            console.log(`Fetching content from: ${entry.download_url}`);
            const contentResponse = await fetch(entry.download_url);
            if (!contentResponse.ok) {
              throw new Error(`Failed to fetch file content: ${contentResponse.status} ${contentResponse.statusText}`);
            }
            content = await contentResponse.text();
          } else {
            throw new Error(`No content available for ${entry.path}`);
          }

          // Write file content
          logger.debug(`Writing file: ${fullPath}`);
          console.log(`Writing file: ${fullPath}`);
          await instance.fs.writeFile(fullPath, content);
          logger.debug(`Successfully wrote file: ${fullPath}`);
          console.log(`Successfully wrote file: ${fullPath}`);
        } catch (error) {
          logger.error(`Error processing file ${entry.path}:`, error);
          console.error(`Error processing file ${entry.path}:`, error);
          throw error;
        }
      }
    }
  }

  try {
    logger.debug('Starting to process repository contents');
    console.log('Starting to process repository contents');
    await processEntry('');
    logger.debug('Successfully loaded GitHub repository');
    console.log('Successfully loaded GitHub repository');
    
    // Verify files were written
    const files = await instance.fs.readdir(WORK_DIR);
    logger.debug(`Files in work directory: ${JSON.stringify(files)}`);
    console.log(`Files in work directory: ${JSON.stringify(files)}`);
    
    return true;
  } catch (error) {
    logger.error('Error setting up GitHub project:', error);
    console.error('Error setting up GitHub project:', error);
    throw error;
  }
}
