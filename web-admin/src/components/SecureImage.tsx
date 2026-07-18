import { useEffect, useState, type CSSProperties } from "react";
import { fetchFileObjectUrl } from "../api/client";

/**
 * Hien thi anh luu tren server MA phai qua endpoint co xac thuc (khong con URL public).
 * Tai anh ve dang Blob (kem token), tao object URL, va revoke khi unmount/doi anh.
 * Neu `path` rong hoac loi tai, tra ve `fallback` (mac dinh khong hien gi).
 */
export function SecureImage({
  path,
  alt,
  style,
  className,
  fallback = null,
}: {
  path?: string | null;
  alt?: string;
  style?: CSSProperties;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    setSrc(undefined);
    setFailed(false);

    if (!path) return;
    fetchFileObjectUrl(path)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!path || failed) return <>{fallback}</>;
  if (!src) return <>{fallback}</>;
  return <img src={src} alt={alt} style={style} className={className} />;
}
