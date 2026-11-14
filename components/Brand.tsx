import { View, Text, StyleSheet } from 'react-native';

export function RxMark({ size = 54 }: { size?: number }) {
  const tile = size;
  return <View style={[s.tile,{width:tile,height:tile,borderRadius:tile*0.22}]}>
    <View style={[s.capsule,{width:tile*0.57,height:tile*0.25,borderRadius:tile*0.14,transform:[{rotate:'-45deg'}]}]}>
      <View style={{flex:1,backgroundColor:'#9AF0DF',borderTopLeftRadius:tile*0.14,borderBottomLeftRadius:tile*0.14}} />
      <View style={{flex:1,backgroundColor:'#FFFFFF',borderTopRightRadius:tile*0.14,borderBottomRightRadius:tile*0.14}} />
    </View>
    <View style={[s.check,{width:tile*0.27,height:tile*0.27,borderRadius:tile*0.14,right:tile*0.1,bottom:tile*0.1}]}>
      <View style={[s.tickA,{width:tile*0.09,height:tile*0.045,borderRadius:3,transform:[{rotate: '45deg'}]}]} />
      <View style={[s.tickB,{width:tile*0.16,height:tile*0.045,borderRadius:3,transform:[{rotate:'-48deg'}]}]} />
    </View>
  </View>;
}

export function Brand({ size = 54, dark = false }: { size?: number; dark?: boolean }) {
  return <View style={s.row}>
    <RxMark size={size} />
    <Text style={[s.word,{fontSize:size*0.52,color:dark?'#FFFFFF':'#10182D'}]}><Text style={{color:'#117F74'}}>Rx</Text>Check</Text>
  </View>;
}

const s=StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',gap:Math.max(10, sizeGap(54))},
  tile:{backgroundColor:'#117F74',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  capsule:{flexDirection:'row',overflow:'hidden'},
  check:{position:'absolute',backgroundColor:'#F5A000',alignItems:'center',justifyContent:'center'},
  tickA:{backgroundColor:'#FFFFFF',position:'absolute',left:'19%',top:'48%'},
  tickB:{backgroundColor:'#FFFFFF',position:'absolute',left:'39%',top:'40%'},
  word:{fontWeight:'900',letterSpacing:-1.2},
});
function sizeGap(_size:number){return 12;}
