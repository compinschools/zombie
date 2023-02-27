

var stage = "none";
var setTime;
const messages = [];
function drawTxt(x, y, scale, text, r, g, b, a) {
    let aspect = Math.floor(GetAspectRatio(true) * 1000)
    SetTextFont(4)
    //SetTextProportional(1)
    SetTextScale(scale, scale)
    SetTextColour(r, g, b, a)
    SetTextDropShadow(0, 0, 0, 0, 255)
    //SetTextEdge(2, 0, 0, 0, 255)
    //SetTextJustification(0);
    SetTextCentre(true);
    SetTextDropShadow()
    SetTextOutline()
    SetTextEntry("STRING")
    AddTextComponentString(text)

    DrawText(x, y)
}


onNet('zombie:showNotify', (title, text, duration, type) => {
  emit("SllimNotify:showNotify",title, text, duration, type)

})

onNet('zombie:drawtxt',async (x,y,scale,text,r,g,b,a,duration=5000) =>{
  
  
     messages.push({
      x:x,
      y:y,
      scale:scale,
      text:text,
      r:r,g:g,b:b,a:a,
      time: Date.now(),
      duration: duration
    }) 
    console.log(text);
    
  });


setTick(() => {
    

    messages.forEach((message) => {
        if(Date.now() - message.time < message.duration){
        drawTxt(
          message.x,
          message.y,
          message.scale,
          message.text,
          message.r,
          message.g,
          message.b,
          message.a);
        }

    
      })

})