import NavigationClient from './NavigationClient';
import { NavigationLinkData } from '@/lib/types/navigation';

interface NavigationProps {
  links: NavigationLinkData[];
}

export default function Navigation({ links }: NavigationProps) {
  return <NavigationClient links={links} />;
}