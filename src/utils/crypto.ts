// declare var TextDecoder: any
var ab2str = require('arraybuffer-to-string')
var str2ab = require('string-to-arraybuffer')

const fromHex = (h: string) => {
  if (h.slice(0, 2) == '\\x') {
    h = h.slice(2)
  }
  var s = ''
  for (var i = 0; i < h.length; i += 2) {
    s += String.fromCharCode(parseInt(h.slice(i, i + 2), 16))
  }
  return s
}

const encryptEntry = async (content: any, secretKey: CryptoKey) => {
  let utf8Encoder = new TextEncoder()

  let ivBuffer = window.crypto.getRandomValues(new Uint8Array(16))
  let contentBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CTR',
      counter: ivBuffer,
      length: 32,
    },
    secretKey,
    utf8Encoder.encode(content)
  )
  let contentEncrypted = ab2str(contentBuffer, 'hex')
  let iv = ab2str(ivBuffer, 'hex')

  return { contentEncrypted, iv }
}

const decryptEntry = async (content: any, iv: string, secretKey: CryptoKey) => {
  let ivUtf = fromHex(iv)
  let ivAb = str2ab(ivUtf)

  let contentUtf = fromHex(content)
  let contentAb = str2ab(contentUtf)

  let contentBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: ivAb,
      length: 32,
    },
    secretKey,
    contentAb
  )
  let contentDecrypted = ab2str(contentBuffer, 'utf8')

  return { contentDecrypted }
}

export { encryptEntry, decryptEntry }
