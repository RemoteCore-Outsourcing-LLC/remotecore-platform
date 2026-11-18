export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a className="logo" href={href}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/rco-mark.webp" width={240} height={123} alt="" />
      <span>
        RemoteCore
        <small>Outsourcing</small>
      </span>
    </a>
  );
}
