
const normalizeUrl = (value?: string) => {
  if (!value) return '';
  return value.trim().replace(/\/$/, '');
};

const getUrlOverride = () => {
  if (typeof window === 'undefined') return '';

  const params = new URLSearchParams(window.location.search);
  const fromQuery = normalizeUrl(params.get('host') || params.get('publicHost') || '');

  if (fromQuery) {
    window.localStorage.setItem('qr_public_host', fromQuery);
    return fromQuery;
  }

  return normalizeUrl(window.localStorage.getItem('qr_public_host') || '');
};

const isLoopbackHost = (host?: string) => {
  if (!host) return true;
  return ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(host);
};

const isPrivateIp = (ip?: string) => {
  if (!ip) return false;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
};

const getCurrentOrigin = () => {
  return 'http://localhost:5173';
};

const getCurrentApiOrigin = () => {
  return 'http://localhost:9005';
};

const getLocalNetworkAddress = async () => {
  if (typeof window === 'undefined' || !(window as Window & typeof globalThis & { RTCPeerConnection?: new () => RTCPeerConnection }).RTCPeerConnection) {
    return null;
  }

  try {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const candidates: string[] = [];

    pc.onicecandidate = (event) => {
      if (event.candidate?.candidate) {
        const match = event.candidate.candidate.match(/(?:^| )((?:\d{1,3}\.){3}\d{1,3})(?= |$)/);
        if (match) {
          candidates.push(match[1]);
        }
      }
    };

    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise((resolve) => window.setTimeout(resolve, 700));
    pc.close();

    return candidates.find(isPrivateIp) || candidates.find((candidate) => !candidate.startsWith('127.') && !candidate.startsWith('169.254.')) || null;
  } catch {
    return null;
  }
};

const configuredFrontendUrl = normalizeUrl(import.meta.env.VITE_PUBLIC_URL);
const configuredApiUrl = normalizeUrl(import.meta.env.VITE_API_BASE_URL);
const runtimeOverride = getUrlOverride();

export const API_BASE_URL = configuredApiUrl || `${getCurrentApiOrigin()}/api`;
export const API_FRONTEND = configuredFrontendUrl || runtimeOverride || getCurrentOrigin();
export const SOCKET_URL = configuredApiUrl ? configuredApiUrl.replace(/\/api$/, '') : getCurrentApiOrigin();

export const getFrontendBaseUrl = async () => {
  if (configuredFrontendUrl) {
    return configuredFrontendUrl;
  }

  if (runtimeOverride) {
    return runtimeOverride;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    if (!isLoopbackHost(hostname) && isPrivateIp(hostname)) {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }

    const localIp = await getLocalNetworkAddress();
    if (localIp) {
      return `${protocol}//${localIp}${port ? `:${port}` : ''}`;
    }
  }

  return getCurrentOrigin();
};

export const getApiBaseUrl = async () => {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (runtimeOverride) {
    return `${runtimeOverride.replace(/:\d+$/, '')}:9005/api`;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    if (!isLoopbackHost(hostname) && isPrivateIp(hostname)) {
      return `${protocol}//${hostname}:9005/api`;
    }

    const localIp = await getLocalNetworkAddress();
    if (localIp) {
      return `${protocol}//${localIp}:9005/api`;
    }
  }

  return `${getCurrentApiOrigin()}/api`;
};

export const API_ENDPOINTS = {
  // Auth Routes
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  FORGETPASSWORD: `${API_BASE_URL}/auth/forgot_password`,
  RESETPASSWORD: `${API_BASE_URL}/auth/reset-password`,

  // Menu Routes
  LISTALLITEMS: `${API_BASE_URL}/menu/list`,
  MENU_ACTION: `${API_BASE_URL}/menu`,
  ADDMENUITEM: `${API_BASE_URL}/menu/add-item`,
  DELETEMENUITEM: `${API_BASE_URL}/menu`,

  GET_MENU_ITEM: `${API_BASE_URL}/menu`,

  // Table Routes
  TABLEMANAGEMENT: `${API_BASE_URL}/TableManagement`,
  LISTALLTABLE: `${API_BASE_URL}/table/list`,
  ADDTABLE: `${API_BASE_URL}/table/add`,
  DELETETABLE: `${API_BASE_URL}/table`,
  UPDATETABLE: `${API_BASE_URL}/table`,

  LISTALLORDERS: `${API_BASE_URL}/order/list`,
  UPDATEORDERSTATUS: `${API_BASE_URL}/order/status`,
  ORDER_ACTION: `${API_BASE_URL}/order`,

  // Frontend Navigation Links
  TABLENUMBER: `${API_FRONTEND}/MenuPage/:id`,
  TABLE_BASE: `${API_BASE_URL}/table`,

  CONTACTADMIN: `${API_BASE_URL}/conatctAdmin`
};

export const CATEGORY = {
  BREAD: 'Bread',
  CAKE: 'Cake',
  CUPCAKE: 'Cupcake',
  COOKIES: 'Cookies',
  PASTRIES: 'Pastries',
  DONUTS: 'Donuts',
  BEVERAGE: 'Beverage',
  SPECIAL: 'Special'
};

export const MAPURL = {
  MAP: "https://www.google.com/maps/place/27%C2%B043'51.3%22N+85%C2%B019'46.1%22E/@27.7309964,85.3294834,18z/data=!4m4!3m3!8m2!3d27.730905!4d85.329462?entry=ttu&g_ep=EgoyMDI2MDQxOS4wIKXMDSoASAFQAw%3D%3",
  LOCATION: "https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d22901.190745384483!2d85.32925641091472!3d27.733165611841958!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjfCsDQzJzUxLjMiTiA4NcKwMTknNDYuMSJF!5e1!3m2!1sen!2snp!4v1777114019686!5m2!1sen!2snp"
};

export const OrderStatus = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
}

export const CloudFare_Captcha = {
  SITE_KEY: `0x4AAAAAADoOvGKugWkb8Sdj`,
  SECRET_KEY: `0x4AAAAAADoOvGLSC-y6FaPeGbgwvv4VTww`
}