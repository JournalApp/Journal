// declare var TextDecoder: any
import ab2str from 'arraybuffer-to-string';
import str2ab from 'string-to-arraybuffer';

const fromHex = (h: string) => {
  if (h.startsWith('\\x')) {
    h = h.slice(2);
  }
  let s = '';
  for (let i = 0; i < h.length; i += 2) {
    s += String.fromCharCode(parseInt(h.slice(i, i + 2), 16));
  }
  return s;
};

const encryptEntry = async (content: string, secretKey: CryptoKey) => {
  const utf8Encoder = new TextEncoder();

  const ivBuffer = window.crypto.getRandomValues(new Uint8Array(16));
  const contentBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CTR',
      counter: ivBuffer,
      length: 32,
    },
    secretKey,
    utf8Encoder.encode(content)
  );
  const contentEncrypted = ab2str(contentBuffer, 'hex');
  const iv = ab2str(ivBuffer, 'hex');

  return { contentEncrypted, iv };
};

const decryptEntry = async (content: string, iv: string, secretKey: CryptoKey) => {
  const ivUtf = fromHex(iv);
  const ivAb = str2ab(ivUtf);

  const contentUtf = fromHex(content);
  const contentAb = str2ab(contentUtf);

  const contentBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: ivAb,
      length: 32,
    },
    secretKey,
    contentAb
  );
  const contentDecrypted = ab2str(contentBuffer, 'utf8') as string;

  return { contentDecrypted };
};

export { encryptEntry, decryptEntry };
