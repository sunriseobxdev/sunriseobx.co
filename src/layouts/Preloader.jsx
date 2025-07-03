import appData from "@data/app.json";
import Image from 'next/image';

const Preloader = () => {
  return (
    <div className="preloader"> 
        <figure>
            <Image src={appData.settings.preloader.image} alt={appData.settings.preloader.alt} width={200} height={60} priority />
        </figure>
    </div>
  );
};

export default Preloader;
