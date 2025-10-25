import { EnvVarWarning } from "../env-var-warning";
import { AuthButton } from "../auth-button";
import { hasEnvVars } from "@/lib/utils";

export default function NavigationRightSide() {
  return (
    <div className="hidden md:block">
      {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
    </div>
  );
}
