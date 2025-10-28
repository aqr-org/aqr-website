import { AuthButton } from "../auth-button";
import SearchButton from "../SearchButton";

export default function NavigationRightSide() {
  return (
    <div className="hidden md:flex items-center gap-2">
      <SearchButton liveSearch={false} />
      <AuthButton />
    </div>
  );
}
