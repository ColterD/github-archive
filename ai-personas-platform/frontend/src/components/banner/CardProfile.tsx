import Image from "next/image";
import { IconType } from "react-icons";
interface Icard {
  heroImage: string;
  name: string;
  Icon?: IconType;
  zIndex?: number;
  maxWidth?: number;
}
export default function CardProfile(props: Icard) {
  const zIndex = props.zIndex ? `z-[${props.zIndex}]` : "z-[0]";
  const maxWidth = props.maxWidth
    ? `w-[${props.maxWidth}px]`
    : "w-[246px] w-full";

  const imgWidth = props.maxWidth ? props.maxWidth : 180;
  return (
    <div
      className={`hero relative border ${maxWidth} rounded-[13px] h-max overflow-hidden ${zIndex}`}
    >
      <div className="image w-full object-fill ">
        <Image src={props.heroImage}  alt={""} width={imgWidth} height={90} />
      </div>
      <div className="cardName absolute top-0 w-full p-2">
        <h4 className="bg-[#ededea47] rounded-full w-max py-1 px-2">
          {props.name}
        </h4>
      </div>
      <div className="CardFooter absolute bottom-0 p-2 w-full">
        <div
          className={`Content  bg-[#ededea47]  rounded-full w-full h-full`}
        >
          <Image
            src={"/cardProfile/voice-message-icon.png"}
            alt={""}
            width={imgWidth}
            height={90}
          />
          {props.Icon && (
            <div className={"absolute left-[8%]  top-[50%]"}>
              <props.Icon size={24} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
