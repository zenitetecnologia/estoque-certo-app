let cachedPublicKey;

const base64ToArrayBuffer = (base64Value) => {
    const base64 = base64Value.replace(/\s/g, '');
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
};

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return window.btoa(binary);
};

const getPublicKey = () => {
    if (cachedPublicKey) return cachedPublicKey;

    const publicKey = __ENCRYPT_PUBLIC_KEY__ || '';

    if (!publicKey.trim()) {
        throw new Error('encrypt_public_key não configurada.');
    }

    cachedPublicKey = publicKey;

    return cachedPublicKey;
};

export const encryptPayload = async (payload) => {
    const publicKeyBase64 = getPublicKey();
    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        base64ToArrayBuffer(publicKeyBase64),
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        false,
        ['encrypt']
    );

    const aesKey = await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
    const encryptedPayloadBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv
        },
        aesKey,
        encodedPayload
    );
    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        rawAesKey
    );

    return {
        key: arrayBufferToBase64(encryptedKeyBuffer),
        iv: arrayBufferToBase64(iv),
        payload: arrayBufferToBase64(encryptedPayloadBuffer)
    };
};

export const encryptedJsonBody = async (payload) => (
    JSON.stringify(await encryptPayload(payload))
);

export const encryptedFetch = async (url, { headers = {}, payload, ...options } = {}) => (
    fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: await encryptedJsonBody(payload)
    })
);