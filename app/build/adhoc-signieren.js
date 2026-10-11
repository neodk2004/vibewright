// electron-builder afterPack: signiert die Mac-App ad hoc („codesign --sign -“).
// Ohne Apple-Entwicklerzertifikat ist das die Mindestsignatur, ohne die macOS auf Apple-Silicon-Macs
// heruntergeladene Apps als „beschädigt“ ablehnt. (Notarisierung braucht ein Apple-Entwicklerkonto.)
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function adhocSignieren(context) {
  if (context.electronPlatformName !== 'darwin') return;
  // Mit Developer-ID-Zertifikat (CSC_LINK) signiert und notarisiert electron-builder selbst – dann hier nichts tun
  if (process.env.CSC_LINK) return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], { stdio: 'inherit' });
};
