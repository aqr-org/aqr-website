import { LoaderCircle } from "lucide-react";

interface LoadingAnimationProps {
  text?: string;
}

const LoadingAnimation = (props: LoadingAnimationProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-32">
      <div className="animate-spin">
        <LoaderCircle />
      </div>
      {props.text && <p className="ml-4 text-lg">{props.text}</p>}
    </div>
  );
};

export {LoadingAnimation};  