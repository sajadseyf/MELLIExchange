import { cn } from '../utils/cn';

interface Props {
  size?: number;
  className?: string;
  src?: string;
}

export function LogoMark({ size = 40, className, src = '/logo.png' }: Props) {
  return (
    <img
      src={src}
      alt="Melli Exchange"
      width={size}
      height={size}
      className={cn('rounded-full', className)}
    />
  );
}
