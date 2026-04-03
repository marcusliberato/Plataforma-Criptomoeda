import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

function isCameraSupported() {
  return !!navigator.mediaDevices?.getUserMedia;
}

function isSecureMediaContext() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.isSecureContext) {
    return true;
  }

  const hostname = String(window.location?.hostname || '');
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getFacingModeValue(facing) {
  return facing === 'front' ? 'user' : 'environment';
}

export const CameraView = forwardRef(function CameraView(
  { children, facing = 'front', className = '', ...props },
  ref,
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [streamError, setStreamError] = useState('');

  useEffect(() => {
    let active = true;

    async function startStream() {
      if (!isCameraSupported()) {
        if (active) {
          setStreamError('A webcam não é suportada neste navegador.');
        }
        return;
      }

      if (!isSecureMediaContext()) {
        if (active) {
          setStreamError(
            'No iPhone, a câmera no navegador exige HTTPS. Use o app nativo iOS ou abra em localhost.',
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: getFacingModeValue(facing),
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setStreamError('');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (error) {
        if (active) {
          setStreamError(
            error instanceof Error && error.message
              ? error.message
              : 'Não foi possível acessar a webcam.',
          );
        }
      }
    }

    startStream();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facing]);

  useImperativeHandle(ref, () => ({
    async takePictureAsync() {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error('Camera not ready');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas not available');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const uri = canvas.toDataURL('image/jpeg', 0.92);

      return {
        uri,
      };
    },
  }));

  return (
    <div
      className={`camera-view ${className}`.trim()}
      data-facing={facing}
      {...props}
    >
      {streamError ? (
        <div className='camera-overlay'>{streamError}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            className='camera-video'
            autoPlay
            muted
            playsInline
          />
          {children}
        </>
      )}
    </div>
  );
});

export function useCameraPermissions() {
  const [permission, setPermission] = useState({
    granted: false,
    status: 'undetermined',
    reason: '',
  });

  async function requestPermission() {
    if (!isCameraSupported()) {
      const unsupportedPermission = {
        granted: false,
        status: 'unsupported',
        reason: 'A webcam não é suportada neste navegador.',
      };
      setPermission(unsupportedPermission);
      return unsupportedPermission;
    }

    if (!isSecureMediaContext()) {
      const insecurePermission = {
        granted: false,
        status: 'insecure_context',
        reason:
          'No iPhone, a câmera no navegador exige HTTPS. Use o app nativo iOS ou localhost.',
      };
      setPermission(insecurePermission);
      return insecurePermission;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());

      const nextPermission = {
        granted: true,
        status: 'granted',
        reason: '',
      };
      setPermission(nextPermission);
      return nextPermission;
    } catch (error) {
      const nextPermission = {
        granted: false,
        status: 'denied',
        reason:
          error instanceof Error && error.message
            ? error.message
            : 'Permissão negada para câmera.',
      };
      setPermission(nextPermission);
      return nextPermission;
    }
  }

  return [permission, requestPermission];
}
