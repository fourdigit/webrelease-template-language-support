import * as path from 'path';
import * as fs from 'fs';
import { workspace, ExtensionContext, window, OutputChannel } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;
let outputChannel: OutputChannel;

export function activate(context: ExtensionContext) {
    outputChannel = window.createOutputChannel('WebRelease Template LSP');
    
    // Get the Python interpreter path
    const pythonPath = getPythonPath();
    
    // Get the server script path
    const serverScriptPath = path.join(
        context.extensionPath,
        'server',
        '__main__.py'
    );
    
    // Check if server script exists
    if (!fs.existsSync(serverScriptPath)) {
        window.showErrorMessage(
            `WebRelease Template LSP server not found at ${serverScriptPath}`
        );
        return;
    }
    
    outputChannel.appendLine(`Python path: ${pythonPath}`);
    outputChannel.appendLine(`Server script: ${serverScriptPath}`);
    
    // Server options
    const serverOptions: ServerOptions = {
        command: pythonPath,
        args: ['-m', 'server'],
        options: {
            cwd: path.join(context.extensionPath, 'server'),
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1',
            },
        },
    };
    
    // Client options
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'webrelease' },
        ],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
        },
        outputChannel: outputChannel,
    };
    
    // Create the language client
    client = new LanguageClient(
        'webrelease-lsp',
        'WebRelease Template Language Server',
        serverOptions,
        clientOptions
    );
    
    // Start the client
    client.start();
    
    outputChannel.appendLine('WebRelease Template LSP started');
    
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(client);
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

function getPythonPath(): string {
    // Try to get Python path from workspace settings
    const config = workspace.getConfiguration('python');
    const pythonPath = config.get<string>('defaultInterpreterPath');
    
    if (pythonPath) {
        return pythonPath;
    }
    
    // Try common Python executables
    const pythonExecutables = ['python3', 'python', 'python.exe'];
    
    for (const executable of pythonExecutables) {
        try {
            // Check if executable exists
            require('child_process').execSync(`which ${executable}`, {
                stdio: 'pipe',
            });
            return executable;
        } catch {
            // Try next executable
        }
    }
    
    // Default to python3
    return 'python3';
}
