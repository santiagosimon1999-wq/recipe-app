import logo192 from '../../assets/optimized/savora-logo-192.jpg'
import logo280 from '../../assets/optimized/savora-logo-280.jpg'
import logo560 from '../../assets/optimized/savora-logo-560.jpg'

type SavoraLogoProps = {
  className?: string
  alt?: string
}

export function SavoraLogo({
  className = 'auth-brand__logo',
  alt = 'Savora logo',
}: SavoraLogoProps) {
  return (
    <picture>
      <source
        media="(max-width: 480px)"
        srcSet={`${logo192} 192w`}
      />
      <source srcSet={`${logo280} 280w, ${logo560} 560w`} />
      <img
        src={logo280}
        srcSet={`${logo192} 192w, ${logo280} 280w, ${logo560} 560w`}
        sizes="(max-width: 480px) 96px, 140px"
        alt={alt}
        className={className}
        width={280}
        height={280}
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  )
}
