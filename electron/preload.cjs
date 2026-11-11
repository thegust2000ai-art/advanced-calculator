// واجهة بسيطة للتطبيق — لا نعرّض أي صلاحيات Node للواجهة
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  version: process.env.npm_package_version || '1.0.0',
});
