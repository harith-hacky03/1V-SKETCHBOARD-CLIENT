import React, { useEffect, useRef, useState } from 'react'
import styles from './Menu.module.css'
import io from 'socket.io-client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown,faArrowRotateLeft,faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
const Menu = () => {
    const canvasRef=useRef(null)
    const [canDraw,setCanDraw]=useState(false)
    const [context,setContext]=useState(null)
    const [canvas,setCanvas]=useState(null)
    const [socket,setSocket]=useState(null)
    const [url,setUrl]=useState("")
    const dataArray=useRef([])
    const pointer=useRef(0)


    const drawBegin=(x,y)=>{
        
        context.beginPath()
        context.moveTo(x,y)
    }

    const drawPath=(x,y)=>{
        context.lineTo(x,y)
        context.stroke()
    }

    const handleColorChange=(color)=>{
        //console.log(color)
        if(!context) return
        context.strokeStyle=color

        socket.emit('send-color',color)
    }

    const strokeSizeChange=(size)=>{
        if(!context) return
        context.lineWidth=size

        socket.emit('send-size',size)
    }


    useEffect(()=>{
        if(!canvasRef.current) return
        const canvas=canvasRef.current
        setCanvas(canvas)

        let socket=io.connect('http://localhost:5000')
        setSocket(socket)

        canvas.width=window.innerWidth
        canvas.height=window.innerHeight-1

        const context=canvas.getContext('2d')
        setContext(context)

        socket.emit('test',{})
    },[])

    useEffect(()=>{
        if(!socket) return
        
        socket.on('receive-path',(data)=>{
            //console.log("p")
            drawBegin(data.x,data.y)
        })

        socket.on('receive-line',(data)=>{
            //console.log("l")
            drawPath(data.x,data.y)
        })

        socket.on('receive-color',(data)=>{
            console.log(data)
            context.strokeStyle=data
        })

        socket.on('receive-size',(data)=>{
            console.log(typeof data)
            
            context.lineWidth=parseInt(data)
        })
        

    },[socket])

    const handleMouseDown=(x,y)=>{
        setCanDraw(true)
        const rect=canvas.getBoundingClientRect()
        context.beginPath()
        context.moveTo(x-rect.left,y-rect.top)

        socket.emit('send-path',{
            x:x-rect.left,
            y:y-rect.top
        })

    }

    const handleMouseUp=()=>{
        setCanDraw(false)
        const rect=canvas.getBoundingClientRect()
        setUrl(canvas.toDataURL())
        const imageData=context.getImageData(rect.left,rect.top,canvas.width,canvas.height)
        
        dataArray.current.push(imageData)
        pointer.current=dataArray.current.length-1
        //console.log(pointer.current)
        //console.log(dataArray)
    }

    const handleMouseMove=(x,y)=>{
        if(canDraw)
        {
            const rect=canvas.getBoundingClientRect()
            context.lineTo(x-rect.left,y-rect.top)
            context.stroke()

            socket.emit('send-line',{
                x:x-rect.left,
                y:y-rect.top
            })
        }
    }

    const undo=()=>{
        const rect=canvas.getBoundingClientRect()
        if(pointer.current>0)
        {
            pointer.current=pointer.current-1
            //console.log(dataArray.current[pointer.current])
        
            const imageData=dataArray.current[pointer.current]
            context.putImageData(imageData,rect.left,rect.top)
        }
    }

    const redo=()=>{
        //console.log(pointer.current,dataArray.current.length)
        if(pointer.current<dataArray.current.length-1)
        {
            pointer.current=pointer.current+1
            const imageData=dataArray.current[pointer.current]
            context.putImageData(imageData,0,0)
        }
    }

  return (
    <div className={styles.main}>
        <div className='flex absolute w-1/4 justify-around border-2 mt-5 border-purple-400 bg-purple-100 py-2 rounded-xl left-1/2 translate-x-[-50%]'>
        <a href={url} download={true}><button className={styles.btn}><FontAwesomeIcon icon={faFileArrowDown} /></button></a>
        <button onClick={undo} className=""><FontAwesomeIcon icon={faArrowRotateLeft} /></button>
        <button onClick={redo}  className=''><FontAwesomeIcon icon={faArrowRotateRight} /></button>
        </div>
        <div className='absolute border-2 rounded-xl border-purple-200 bg-purple-100 top-1/4 left-12'>
            <div className='p-5'>
                <div className='flex gap-5'>
                <div onClick={()=>handleColorChange('yellow')} className='w-5 h-5 rounded-sm bg-yellow-400 cursor-pointer'></div>
                <div onClick={()=>handleColorChange('green')} className='w-5 h-5 rounded-sm bg-green-400 cursor-pointer'></div>
                <div onClick={()=>handleColorChange('black')} className='w-5 h-5 rounded-sm bg-black cursor-pointer'></div>
                <div onClick={()=>handleColorChange('blue')} className='w-5 h-5 rounded-sm bg-blue-400 cursor-pointer'></div>
                </div>
            </div>
            <div className='flex items-center justify-center mb-10'>
                <input onChange={(event)=>strokeSizeChange(event.target.value)} type='range' min={1} max={10}  step={1}/>
            </div>
        </div>
        <div className='min-h-screen overflow-hidden'>
        <canvas  onMouseDown={(event)=>handleMouseDown(event.clientX,event.clientY)} onMouseMove={(event)=>handleMouseMove(event.clientX,event.clientY)} onMouseUp={handleMouseUp} ref={canvasRef} />
        </div>
    </div>
  )
}

export default Menu