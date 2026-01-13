import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';

interface SandboxConfig {
  userId: string;
  labType: string;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'impossible';
  dockerImage: string;
}

interface SandboxInstance {
  containerId: string;
  port: number;
  webSocketPort?: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
}

class SandboxService {
  private docker: Docker;
  private usedPorts: Set<number>;
  private readonly portRangeStart = 8000;
  private readonly portRangeEnd = 9000;

  constructor() {
    this.docker = new Docker({
      socketPath: process.platform === 'win32' 
        ? '//./pipe/docker_engine' 
        : '/var/run/docker.sock',
    });
    this.usedPorts = new Set();
  }

  // Get available port
  private getAvailablePort(): number {
    for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new Error('No available ports');
  }

  // Release port
  private releasePort(port: number): void {
    this.usedPorts.delete(port);
  }

  // Create isolated sandbox container
  async createSandbox(config: SandboxConfig): Promise<SandboxInstance> {
    try {
      const port = this.getAvailablePort();
      const containerName = `pentest-${config.labType}-${config.difficultyLevel}-${uuidv4()}`;

      // Environment variables for the container
      const env = [
        `LAB_TYPE=${config.labType}`,
        `DIFFICULTY=${config.difficultyLevel}`,
        `USER_ID=${config.userId}`,
      ];

      // Create container with network isolation
      const container = await this.docker.createContainer({
        Image: config.dockerImage,
        name: containerName,
        Env: env,
        ExposedPorts: {
          '80/tcp': {},
          '3000/tcp': {},
        },
        HostConfig: {
          PortBindings: {
            '80/tcp': [{ HostPort: port.toString() }],
          },
          Memory: 512 * 1024 * 1024, // 512MB RAM limit
          MemorySwap: 512 * 1024 * 1024,
          CpuQuota: 50000, // 50% CPU
          NetworkMode: 'bridge',
          AutoRemove: false,
          RestartPolicy: {
            Name: 'no',
          },
        },
        Labels: {
          'pentest.user': config.userId,
          'pentest.lab': config.labType,
          'pentest.difficulty': config.difficultyLevel,
        },
      });

      // Start container
      await container.start();

      console.log(`✅ Sandbox created: ${containerName} on port ${port}`);

      return {
        containerId: container.id,
        port,
        status: 'running',
      };
    } catch (error) {
      console.error('Failed to create sandbox:', error);
      throw new Error('Failed to create sandbox environment');
    }
  }

  // Stop and remove sandbox
  async destroySandbox(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      
      // Get container info to release port
      const info = await container.inspect();
      const portBindings = info.HostConfig.PortBindings;
      
      if (portBindings && portBindings['80/tcp']) {
        const port = parseInt(portBindings['80/tcp'][0].HostPort);
        this.releasePort(port);
      }

      // Stop and remove container
      await container.stop({ t: 10 });
      await container.remove();

      console.log(`✅ Sandbox destroyed: ${containerId}`);
    } catch (error) {
      console.error('Failed to destroy sandbox:', error);
      throw new Error('Failed to destroy sandbox');
    }
  }

  // Get sandbox status
  async getSandboxStatus(containerId: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      
      if (info.State.Running) {
        return 'running';
      } else if (info.State.Status === 'exited') {
        return 'stopped';
      } else {
        return 'error';
      }
    } catch (error) {
      return 'error';
    }
  }

  // Get container logs
  async getContainerLogs(containerId: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
      });
      
      return logs.toString('utf8');
    } catch (error) {
      console.error('Failed to get container logs:', error);
      return '';
    }
  }

  // Execute command in container
  async executeCommand(containerId: string, command: string[]): Promise<any> {
    try {
      const container = this.docker.getContainer(containerId);
      
      const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: false });
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        stream.on('data', (chunk: Buffer) => {
          output += chunk.toString('utf8');
        });

        stream.on('end', () => {
          resolve(output);
        });

        stream.on('error', (err: Error) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw new Error('Failed to execute command in sandbox');
    }
  }

  // Restart sandbox
  async restartSandbox(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.restart({ t: 10 });
      console.log(`✅ Sandbox restarted: ${containerId}`);
    } catch (error) {
      console.error('Failed to restart sandbox:', error);
      throw new Error('Failed to restart sandbox');
    }
  }

  // List all user sandboxes
  async listUserSandboxes(userId: string): Promise<any[]> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: [`pentest.user=${userId}`],
        },
      });

      return containers.map(container => ({
        id: container.Id,
        name: container.Names[0].replace('/', ''),
        status: container.State,
        created: container.Created,
        ports: container.Ports,
        labels: container.Labels,
      }));
    } catch (error) {
      console.error('Failed to list sandboxes:', error);
      return [];
    }
  }

  // Cleanup old sandboxes (older than 12 hours)
  async cleanupOldSandboxes(): Promise<void> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['pentest.user'],
        },
      });

      const now = Date.now() / 1000;
      const maxAge = 12 * 60 * 60; // 12 hours

      for (const containerInfo of containers) {
        if (now - containerInfo.Created > maxAge) {
          console.log(`Cleaning up old sandbox: ${containerInfo.Id}`);
          await this.destroySandbox(containerInfo.Id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old sandboxes:', error);
    }
  }

  // Pull docker image
  async pullImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.pull(imageName, (err: any, stream: any) => {
        if (err) {
          return reject(err);
        }

        this.docker.modem.followProgress(stream, (err: any, output: any) => {
          if (err) {
            return reject(err);
          }
          console.log(`✅ Image pulled: ${imageName}`);
          resolve();
        });
      });
    });
  }

  // Check if Docker is available
  async isDockerAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      console.error('Docker is not available:', error);
      return false;
    }
  }
}

export default new SandboxService();
