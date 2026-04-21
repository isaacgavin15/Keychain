export class KeychainManager {
  constructor() {
    this.keychains = [];
  }

  addKeychain(config) {
    const keychain = {
      id: `kc-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      hook: { ...config.hook },
      pendantDataUrl: config.pendantDataUrl,
      size: config.size || 110,
      timestamp: Date.now(),
    };
    this.keychains.push(keychain);
    return keychain;
  }

  removeKeychain(id) {
    this.keychains = this.keychains.filter(kc => kc.id !== id);
  }

  getAll() {
    return [...this.keychains];
  }

  clear() {
    this.keychains = [];
  }
}

export function renderKeychains(groupElement, keychains, viewBoxWidth) {
  if (!keychains || keychains.length === 0) {
    groupElement.innerHTML = "";
    return;
  }

  const svg = `
    <defs>
      <filter id="keychainShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.15" />
      </filter>
    </defs>
  `;

  const keychainHtml = keychains.map(kc => {
    const { x, y } = kc.hook;
    const size = kc.size || 110;
    const chainLength = 45;
    const loopY = y + 12;

    return `
      <g class="keychain" data-keychain-id="${kc.id}" filter="url(#keychainShadow)">
        <path class="keychain-chain" d="M ${x} ${y - 22} L ${x} ${loopY}" />
        <ellipse class="keychain-loop" cx="${x}" cy="${loopY + 8}" rx="10" ry="8" />
        <image href="${kc.pendantDataUrl}" x="${x - size / 2}" y="${loopY + 16}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />
      </g>
    `;
  }).join("");

  groupElement.innerHTML = svg + keychainHtml;
}