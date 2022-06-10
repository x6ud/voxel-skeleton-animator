import {promises as fs, constants as FS_CONSTANTS} from 'fs';
import {PluginOption} from 'vite';
import urlParse from 'url-parse';
import multiparty from 'multiparty';

export default function (basePath: string): PluginOption {
    return {
        name: 'file-server',
        configureServer(server) {
            server.middlewares.use(basePath, async function (req, res) {
                const url = urlParse(req.url || '/');
                const path = '.' + basePath + url.pathname;
                try {
                    switch (req.method) {
                        case 'GET': {
                            const stat = await fs.stat(path);
                            if (stat.isDirectory()) {
                                const files = await fs.readdir(path);
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(files));
                                res.end();
                            } else if (stat.isFile()) {
                                const content = await fs.readFile(path);
                                res.writeHead(200, {'Content-Type': 'binary'});
                                res.write(content);
                                res.end();

                            } else {
                                res.writeHead(404);
                                res.end();
                            }
                        }
                            break;
                        case 'POST': {
                            const parts = await new Promise<{
                                fields: { [name: string]: any },
                                files: {
                                    [name: string]: {
                                        fieldName: string,
                                        originalFilename: string,
                                        path: string,
                                        headers: { [name: string]: string },
                                        size: number
                                    }[]
                                }
                            }>(function (resolve, reject) {
                                const form = new multiparty.Form();
                                form.parse(req, function (error, fields, files) {
                                    resolve({fields, files});
                                });
                            });
                            const file = parts.files.file;
                            if (file) {
                                const temp = file[0].path;
                                await fs.copyFile(temp, path, FS_CONSTANTS.COPYFILE_FICLONE);
                                await fs.rm(temp);
                            }
                            res.writeHead(200);
                            res.end();
                        }
                            break;
                        default: {
                            res.writeHead(404);
                            res.end();
                        }
                            break;
                    }
                } catch (e) {
                    console.error(e);
                    res.writeHead(500);
                    if (e instanceof Error) {
                        res.write(e.message);
                    }
                    res.end();
                }
            });
        }
    };
}