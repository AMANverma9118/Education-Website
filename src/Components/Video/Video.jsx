import React, { useRef } from 'react'
import './Video.css'
import video from '../../assets/video.mp4'

const Video = ({playstate,setPlayState}) => {

    //For selecting the whole dev we use useref
    const player = useRef(null);
    
    const closePlayer = (e) =>{
        if(e.target === player.current){
            setPlayState(false);
        }
    }

  return (
    <div className={`video ${playstate?'':'hide'}`} ref={player} onClick={closePlayer}>
      <video src={video} autoPlay muted controls></video>
    </div>
  )
}

export default Video
