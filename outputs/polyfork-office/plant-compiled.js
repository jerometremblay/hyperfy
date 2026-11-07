var PolyspoonRecipe=(()=>{var Qi=Object.defineProperty;var Yr=Object.getOwnPropertyDescriptor;var Zr=Object.getOwnPropertyNames;var Jr=Object.prototype.hasOwnProperty;var $r=(m,t)=>{for(var e in t)Qi(m,e,{get:t[e],enumerable:!0})},Kr=(m,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Zr(t))!Jr.call(m,i)&&i!==e&&Qi(m,i,{get:()=>t[i],enumerable:!(n=Yr(t,i))||n.enumerable});return m};var Qr=m=>Kr(Qi({},"__esModule",{value:!0}),m);var Ac={};$r(Ac,{createAsset:()=>Ec,disposeAsset:()=>Tc,metadata:()=>wc});var xr=1;var yr=3,zs=0,vr=1,Qe=2;var Mr=1;var Sr=100;var br=204,wr=205;var vs=0,Ms=1,Ss=2,Mi=3,bs=4,ws=5,Es=6,Ts=7,ks=0,Er=1,Tr=2;var Vs=1,Hs=2,Gs=3,Ws=4,Xs=5,qs=6,Ys=7;var Zs=300,Ar=301,Js=302;var Rr=306,Gn=1e3,Vn=1001,As=1002,Rs=1003;var Wi=1006;var Xi=1008;var Cr=1009;var Ir=1015;var qi=1023;var Wn=2300,Si=2301,xi=2302,Cs=2303,Is=2400,Ps=2401,Ls=2402;var Pr=0;var $s="",ye="srgb",Ds="srgb-linear",Ns="linear",yi="srgb";var vi=7680;var Lr=519;var Dr=35044;var Hn=2e3,Us=2001;function jr(m){for(let t=m.length-1;t>=0;--t)if(m[t]>=65535)return!0;return!1}function ta(m){return ArrayBuffer.isView(m)&&!(m instanceof DataView)}function Fs(m){return document.createElementNS("http://www.w3.org/1999/xhtml",m)}var er={},bi=null;function Nr(m){let t=m[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=m[1];e&&e.isStackTrace?m[0]+=" "+e.getLocation():m[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return m}function te(...m){m=Nr(m);let t="THREE."+m.shift();if(bi)bi("warn",t,...m);else{let e=m[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...m)}}function Kt(...m){m=Nr(m);let t="THREE."+m.shift();if(bi)bi("error",t,...m);else{let e=m[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...m)}}function Ln(...m){let t=m.join(" ");t in er||(er[t]=!0,te(...m))}var ea={[vs]:Ms,[Ss]:Es,[bs]:Ts,[Mi]:ws,[Ms]:vs,[Es]:Ss,[Ts]:bs,[ws]:Mi},cn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let i=n[t];if(i!==void 0){let s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let i=n.slice(0);for(let s=0,r=i.length;s<r;s++)i[s].call(this,t);t.target=null}}},ce=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Cc=Math.PI/180,na=180/Math.PI;function jn(){let m=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ce[m&255]+ce[m>>8&255]+ce[m>>16&255]+ce[m>>24&255]+"-"+ce[t&255]+ce[t>>8&255]+"-"+ce[t>>16&15|64]+ce[t>>24&255]+"-"+ce[e&63|128]+ce[e>>8&255]+"-"+ce[e>>16&255]+ce[e>>24&255]+ce[n&255]+ce[n>>8&255]+ce[n>>16&255]+ce[n>>24&255]).toLowerCase()}function bt(m,t,e){return Math.max(t,Math.min(e,m))}function ia(m,t){return(m%t+t)%t}function ji(m,t,e){return(1-e)*m+e*t}function Fn(m,t){switch(t.constructor){case Float32Array:return m;case Uint32Array:return m/4294967295;case Uint16Array:return m/65535;case Uint8Array:case Uint8ClampedArray:return m/255;case Int32Array:return Math.max(m/2147483647,-1);case Int16Array:return Math.max(m/32767,-1);case Int8Array:return Math.max(m/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function xe(m,t){switch(t.constructor){case Float32Array:return m;case Uint32Array:return Math.round(m*4294967295);case Uint16Array:return Math.round(m*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(m*255);case Int32Array:return Math.round(m*2147483647);case Int16Array:return Math.round(m*32767);case Int8Array:return Math.round(m*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Wt=class m{static{m.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=bt(this.x,t.x,e.x),this.y=bt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=bt(this.x,t,e),this.y=bt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(bt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(bt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*n-r*i+t.x,this.y=s*i+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},$e=class{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,r,o){let a=n[i+0],l=n[i+1],c=n[i+2],u=n[i+3],p=s[r+0],_=s[r+1],v=s[r+2],P=s[r+3];if(u!==P||a!==p||l!==_||c!==v){let N=a*p+l*_+c*v+u*P;N<0&&(p=-p,_=-_,v=-v,P=-P,N=-N);let k=1-o;if(N<.9995){let U=Math.acos(N),V=Math.sin(U);k=Math.sin(k*U)/V,o=Math.sin(o*U)/V,a=a*k+p*o,l=l*k+_*o,c=c*k+v*o,u=u*k+P*o}else{a=a*k+p*o,l=l*k+_*o,c=c*k+v*o,u=u*k+P*o;let U=1/Math.sqrt(a*a+l*l+c*c+u*u);a*=U,l*=U,c*=U,u*=U}}t[e]=a,t[e+1]=l,t[e+2]=c,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,s,r){let o=n[i],a=n[i+1],l=n[i+2],c=n[i+3],u=s[r],p=s[r+1],_=s[r+2],v=s[r+3];return t[e]=o*v+c*u+a*_-l*p,t[e+1]=a*v+c*p+l*u-o*_,t[e+2]=l*v+c*_+o*p-a*u,t[e+3]=c*v-o*u-a*p-l*_,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,i=t._y,s=t._z,r=t._order,o=Math.cos,a=Math.sin,l=o(n/2),c=o(i/2),u=o(s/2),p=a(n/2),_=a(i/2),v=a(s/2);switch(r){case"XYZ":this._x=p*c*u+l*_*v,this._y=l*_*u-p*c*v,this._z=l*c*v+p*_*u,this._w=l*c*u-p*_*v;break;case"YXZ":this._x=p*c*u+l*_*v,this._y=l*_*u-p*c*v,this._z=l*c*v-p*_*u,this._w=l*c*u+p*_*v;break;case"ZXY":this._x=p*c*u-l*_*v,this._y=l*_*u+p*c*v,this._z=l*c*v+p*_*u,this._w=l*c*u-p*_*v;break;case"ZYX":this._x=p*c*u-l*_*v,this._y=l*_*u+p*c*v,this._z=l*c*v-p*_*u,this._w=l*c*u+p*_*v;break;case"YZX":this._x=p*c*u+l*_*v,this._y=l*_*u+p*c*v,this._z=l*c*v-p*_*u,this._w=l*c*u-p*_*v;break;case"XZY":this._x=p*c*u-l*_*v,this._y=l*_*u-p*c*v,this._z=l*c*v+p*_*u,this._w=l*c*u+p*_*v;break;default:te("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],i=e[4],s=e[8],r=e[1],o=e[5],a=e[9],l=e[2],c=e[6],u=e[10],p=n+o+u;if(p>0){let _=.5/Math.sqrt(p+1);this._w=.25/_,this._x=(c-a)*_,this._y=(s-l)*_,this._z=(r-i)*_}else if(n>o&&n>u){let _=2*Math.sqrt(1+n-o-u);this._w=(c-a)/_,this._x=.25*_,this._y=(i+r)/_,this._z=(s+l)/_}else if(o>u){let _=2*Math.sqrt(1+o-n-u);this._w=(s-l)/_,this._x=(i+r)/_,this._y=.25*_,this._z=(a+c)/_}else{let _=2*Math.sqrt(1+u-n-o);this._w=(r-i)/_,this._x=(s+l)/_,this._y=(a+c)/_,this._z=.25*_}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(bt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,o=e._x,a=e._y,l=e._z,c=e._w;return this._x=n*c+r*o+i*l-s*a,this._y=i*c+r*a+s*o-n*l,this._z=s*c+r*l+n*a-i*o,this._w=r*c-n*o-i*a-s*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,o=this.dot(t);o<0&&(n=-n,i=-i,s=-s,r=-r,o=-o);let a=1-e;if(o<.9995){let l=Math.acos(o),c=Math.sin(l);a=Math.sin(a*l)/c,e=Math.sin(e*l)/c,this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this._onChangeCallback()}else this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},w=class m{static{m.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(nr.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(nr.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=t.elements,r=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*r,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*r,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*r,this}applyQuaternion(t){let e=this.x,n=this.y,i=this.z,s=t.x,r=t.y,o=t.z,a=t.w,l=2*(r*i-o*n),c=2*(o*e-s*i),u=2*(s*n-r*e);return this.x=e+a*l+r*u-o*c,this.y=n+a*c+o*l-s*u,this.z=i+a*u+s*c-r*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=bt(this.x,t.x,e.x),this.y=bt(this.y,t.y,e.y),this.z=bt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=bt(this.x,t,e),this.y=bt(this.y,t,e),this.z=bt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(bt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,i=t.y,s=t.z,r=e.x,o=e.y,a=e.z;return this.x=i*a-s*o,this.y=s*r-n*a,this.z=n*o-i*r,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ts.copy(this).projectOnVector(t),this.sub(ts)}reflect(t){return this.sub(ts.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(bt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ts=new w,nr=new $e,yt=class m{static{m.prototype.isMatrix3=!0}constructor(t,e,n,i,s,r,o,a,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,o,a,l)}set(t,e,n,i,s,r,o,a,l){let c=this.elements;return c[0]=t,c[1]=i,c[2]=o,c[3]=e,c[4]=s,c[5]=a,c[6]=n,c[7]=r,c[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],o=n[3],a=n[6],l=n[1],c=n[4],u=n[7],p=n[2],_=n[5],v=n[8],P=i[0],N=i[3],k=i[6],U=i[1],V=i[4],B=i[7],K=i[2],tt=i[5],j=i[8];return s[0]=r*P+o*U+a*K,s[3]=r*N+o*V+a*tt,s[6]=r*k+o*B+a*j,s[1]=l*P+c*U+u*K,s[4]=l*N+c*V+u*tt,s[7]=l*k+c*B+u*j,s[2]=p*P+_*U+v*K,s[5]=p*N+_*V+v*tt,s[8]=p*k+_*B+v*j,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],a=t[6],l=t[7],c=t[8];return e*r*c-e*o*l-n*s*c+n*o*a+i*s*l-i*r*a}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],a=t[6],l=t[7],c=t[8],u=c*r-o*l,p=o*a-c*s,_=l*s-r*a,v=e*u+n*p+i*_;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);let P=1/v;return t[0]=u*P,t[1]=(i*l-c*n)*P,t[2]=(o*n-i*r)*P,t[3]=p*P,t[4]=(c*e-i*a)*P,t[5]=(i*s-o*e)*P,t[6]=_*P,t[7]=(n*a-l*e)*P,t[8]=(r*e-n*s)*P,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,r,o){let a=Math.cos(s),l=Math.sin(s);return this.set(n*a,n*l,-n*(a*r+l*o)+r+t,-i*l,i*a,-i*(-l*r+a*o)+o+e,0,0,1),this}scale(t,e){return Ln("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(es.makeScale(t,e)),this}rotate(t){return Ln("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(es.makeRotation(-t)),this}translate(t,e){return Ln("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(es.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},es=new yt,ir=new yt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),sr=new yt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function sa(){let m={enabled:!0,workingColorSpace:Ds,spaces:{},convert:function(i,s,r){return this.enabled===!1||s===r||!s||!r||(this.spaces[s].transfer===yi&&(i.r=Je(i.r),i.g=Je(i.g),i.b=Je(i.b)),this.spaces[s].primaries!==this.spaces[r].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===yi&&(i.r=Dn(i.r),i.g=Dn(i.g),i.b=Dn(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===$s?Ns:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,r){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return Ln("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),m.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return Ln("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),m.colorSpaceToWorking(i,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return m.define({[Ds]:{primaries:t,whitePoint:n,transfer:Ns,toXYZ:ir,fromXYZ:sr,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:ye},outputColorSpaceConfig:{drawingBufferColorSpace:ye}},[ye]:{primaries:t,whitePoint:n,transfer:yi,toXYZ:ir,fromXYZ:sr,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:ye}}}),m}var Ae=sa();function Je(m){return m<.04045?m*.0773993808:Math.pow(m*.9478672986+.0521327014,2.4)}function Dn(m){return m<.0031308?m*12.92:1.055*Math.pow(m,.41666)-.055}var Mn,wi=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Mn===void 0&&(Mn=Fs("canvas")),Mn.width=t.width,Mn.height=t.height;let i=Mn.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=Mn}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Fs("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let r=0;r<s.length;r++)s[r]=Je(s[r]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Je(e[n]/255)*255):e[n]=Je(e[n]);return{data:e,width:t.width,height:t.height}}else return te("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},ra=0,Ei=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ra++}),this.uuid=jn(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let r=0,o=i.length;r<o;r++)i[r].isDataTexture?s.push(ns(i[r].image)):s.push(ns(i[r]))}else s=ns(i);n.url=s}return e||(t.images[this.uuid]=n),n}};function ns(m){return typeof HTMLImageElement<"u"&&m instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&m instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&m instanceof ImageBitmap?wi.getDataURL(m):m.data?{data:Array.from(m.data),width:m.width,height:m.height,type:m.data.constructor.name}:(te("Texture: Unable to serialize Texture."),{})}var aa=0,is=new w,yn=class m extends cn{constructor(t=m.DEFAULT_IMAGE,e=m.DEFAULT_MAPPING,n=Vn,i=Vn,s=Wi,r=Xi,o=qi,a=Cr,l=m.DEFAULT_ANISOTROPY,c=$s){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:aa++}),this.uuid=jn(),this.name="",this.source=new Ei(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=r,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=a,this.offset=new Wt(0,0),this.repeat=new Wt(1,1),this.center=new Wt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new yt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(is).x}get height(){return this.source.getSize(is).y}get depth(){return this.source.getSize(is).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){te(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){te(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Zs)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Gn:t.x=t.x-Math.floor(t.x);break;case Vn:t.x=t.x<0?0:1;break;case As:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Gn:t.y=t.y-Math.floor(t.y);break;case Vn:t.y=t.y<0?0:1;break;case As:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};yn.DEFAULT_IMAGE=null;yn.DEFAULT_MAPPING=Zs;yn.DEFAULT_ANISOTROPY=1;var Nn=class m{static{m.prototype.isVector4=!0}constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i+r[12]*s,this.y=r[1]*e+r[5]*n+r[9]*i+r[13]*s,this.z=r[2]*e+r[6]*n+r[10]*i+r[14]*s,this.w=r[3]*e+r[7]*n+r[11]*i+r[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s,a=t.elements,l=a[0],c=a[4],u=a[8],p=a[1],_=a[5],v=a[9],P=a[2],N=a[6],k=a[10];if(Math.abs(c-p)<.01&&Math.abs(u-P)<.01&&Math.abs(v-N)<.01){if(Math.abs(c+p)<.1&&Math.abs(u+P)<.1&&Math.abs(v+N)<.1&&Math.abs(l+_+k-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let V=(l+1)/2,B=(_+1)/2,K=(k+1)/2,tt=(c+p)/4,j=(u+P)/4,Y=(v+N)/4;return V>B&&V>K?V<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(V),i=tt/n,s=j/n):B>K?B<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(B),n=tt/i,s=Y/i):K<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(K),n=j/s,i=Y/s),this.set(n,i,s,e),this}let U=Math.sqrt((N-v)*(N-v)+(u-P)*(u-P)+(p-c)*(p-c));return Math.abs(U)<.001&&(U=1),this.x=(N-v)/U,this.y=(u-P)/U,this.z=(p-c)/U,this.w=Math.acos((l+_+k-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=bt(this.x,t.x,e.x),this.y=bt(this.y,t.y,e.y),this.z=bt(this.z,t.z,e.z),this.w=bt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=bt(this.x,t,e),this.y=bt(this.y,t,e),this.z=bt(this.z,t,e),this.w=bt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(bt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var ae=class m{static{m.prototype.isMatrix4=!0}constructor(t,e,n,i,s,r,o,a,l,c,u,p,_,v,P,N){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,o,a,l,c,u,p,_,v,P,N)}set(t,e,n,i,s,r,o,a,l,c,u,p,_,v,P,N){let k=this.elements;return k[0]=t,k[4]=e,k[8]=n,k[12]=i,k[1]=s,k[5]=r,k[9]=o,k[13]=a,k[2]=l,k[6]=c,k[10]=u,k[14]=p,k[3]=_,k[7]=v,k[11]=P,k[15]=N,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new m().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,i=1/Sn.setFromMatrixColumn(t,0).length(),s=1/Sn.setFromMatrixColumn(t,1).length(),r=1/Sn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,i=t.y,s=t.z,r=Math.cos(n),o=Math.sin(n),a=Math.cos(i),l=Math.sin(i),c=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){let p=r*c,_=r*u,v=o*c,P=o*u;e[0]=a*c,e[4]=-a*u,e[8]=l,e[1]=_+v*l,e[5]=p-P*l,e[9]=-o*a,e[2]=P-p*l,e[6]=v+_*l,e[10]=r*a}else if(t.order==="YXZ"){let p=a*c,_=a*u,v=l*c,P=l*u;e[0]=p+P*o,e[4]=v*o-_,e[8]=r*l,e[1]=r*u,e[5]=r*c,e[9]=-o,e[2]=_*o-v,e[6]=P+p*o,e[10]=r*a}else if(t.order==="ZXY"){let p=a*c,_=a*u,v=l*c,P=l*u;e[0]=p-P*o,e[4]=-r*u,e[8]=v+_*o,e[1]=_+v*o,e[5]=r*c,e[9]=P-p*o,e[2]=-r*l,e[6]=o,e[10]=r*a}else if(t.order==="ZYX"){let p=r*c,_=r*u,v=o*c,P=o*u;e[0]=a*c,e[4]=v*l-_,e[8]=p*l+P,e[1]=a*u,e[5]=P*l+p,e[9]=_*l-v,e[2]=-l,e[6]=o*a,e[10]=r*a}else if(t.order==="YZX"){let p=r*a,_=r*l,v=o*a,P=o*l;e[0]=a*c,e[4]=P-p*u,e[8]=v*u+_,e[1]=u,e[5]=r*c,e[9]=-o*c,e[2]=-l*c,e[6]=_*u+v,e[10]=p-P*u}else if(t.order==="XZY"){let p=r*a,_=r*l,v=o*a,P=o*l;e[0]=a*c,e[4]=-u,e[8]=l*c,e[1]=p*u+P,e[5]=r*c,e[9]=_*u-v,e[2]=v*u-_,e[6]=o*c,e[10]=P*u+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(oa,t,la)}lookAt(t,e,n){let i=this.elements;return Se.subVectors(t,e),Se.lengthSq()===0&&(Se.z=1),Se.normalize(),sn.crossVectors(n,Se),sn.lengthSq()===0&&(Math.abs(n.z)===1?Se.x+=1e-4:Se.z+=1e-4,Se.normalize(),sn.crossVectors(n,Se)),sn.normalize(),ni.crossVectors(Se,sn),i[0]=sn.x,i[4]=ni.x,i[8]=Se.x,i[1]=sn.y,i[5]=ni.y,i[9]=Se.y,i[2]=sn.z,i[6]=ni.z,i[10]=Se.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],o=n[4],a=n[8],l=n[12],c=n[1],u=n[5],p=n[9],_=n[13],v=n[2],P=n[6],N=n[10],k=n[14],U=n[3],V=n[7],B=n[11],K=n[15],tt=i[0],j=i[4],Y=i[8],st=i[12],it=i[1],gt=i[5],St=i[9],Mt=i[13],Lt=i[2],et=i[6],Bt=i[10],It=i[14],$t=i[3],zt=i[7],Yt=i[11],Qt=i[15];return s[0]=r*tt+o*it+a*Lt+l*$t,s[4]=r*j+o*gt+a*et+l*zt,s[8]=r*Y+o*St+a*Bt+l*Yt,s[12]=r*st+o*Mt+a*It+l*Qt,s[1]=c*tt+u*it+p*Lt+_*$t,s[5]=c*j+u*gt+p*et+_*zt,s[9]=c*Y+u*St+p*Bt+_*Yt,s[13]=c*st+u*Mt+p*It+_*Qt,s[2]=v*tt+P*it+N*Lt+k*$t,s[6]=v*j+P*gt+N*et+k*zt,s[10]=v*Y+P*St+N*Bt+k*Yt,s[14]=v*st+P*Mt+N*It+k*Qt,s[3]=U*tt+V*it+B*Lt+K*$t,s[7]=U*j+V*gt+B*et+K*zt,s[11]=U*Y+V*St+B*Bt+K*Yt,s[15]=U*st+V*Mt+B*It+K*Qt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],r=t[1],o=t[5],a=t[9],l=t[13],c=t[2],u=t[6],p=t[10],_=t[14],v=t[3],P=t[7],N=t[11],k=t[15],U=a*_-l*p,V=o*_-l*u,B=o*p-a*u,K=r*_-l*c,tt=r*p-a*c,j=r*u-o*c;return e*(P*U-N*V+k*B)-n*(v*U-N*K+k*tt)+i*(v*V-P*K+k*j)-s*(v*B-P*tt+N*j)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[1],r=t[5],o=t[9],a=t[2],l=t[6],c=t[10];return e*(r*c-o*l)-n*(s*c-o*a)+i*(s*l-r*a)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],a=t[6],l=t[7],c=t[8],u=t[9],p=t[10],_=t[11],v=t[12],P=t[13],N=t[14],k=t[15],U=e*o-n*r,V=e*a-i*r,B=e*l-s*r,K=n*a-i*o,tt=n*l-s*o,j=i*l-s*a,Y=c*P-u*v,st=c*N-p*v,it=c*k-_*v,gt=u*N-p*P,St=u*k-_*P,Mt=p*k-_*N,Lt=U*Mt-V*St+B*gt+K*it-tt*st+j*Y;if(Lt===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let et=1/Lt;return t[0]=(o*Mt-a*St+l*gt)*et,t[1]=(i*St-n*Mt-s*gt)*et,t[2]=(P*j-N*tt+k*K)*et,t[3]=(p*tt-u*j-_*K)*et,t[4]=(a*it-r*Mt-l*st)*et,t[5]=(e*Mt-i*it+s*st)*et,t[6]=(N*B-v*j-k*V)*et,t[7]=(c*j-p*B+_*V)*et,t[8]=(r*St-o*it+l*Y)*et,t[9]=(n*it-e*St-s*Y)*et,t[10]=(v*tt-P*B+k*U)*et,t[11]=(u*B-c*tt-_*U)*et,t[12]=(o*st-r*gt-a*Y)*et,t[13]=(e*gt-n*st+i*Y)*et,t[14]=(P*V-v*K-N*U)*et,t[15]=(c*K-u*V+p*U)*et,this}scale(t){let e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),i=Math.sin(e),s=1-n,r=t.x,o=t.y,a=t.z,l=s*r,c=s*o;return this.set(l*r+n,l*o-i*a,l*a+i*o,0,l*o+i*a,c*o+n,c*a-i*r,0,l*a-i*o,c*a+i*r,s*a*a+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,r){return this.set(1,n,s,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){let i=this.elements,s=e._x,r=e._y,o=e._z,a=e._w,l=s+s,c=r+r,u=o+o,p=s*l,_=s*c,v=s*u,P=r*c,N=r*u,k=o*u,U=a*l,V=a*c,B=a*u,K=n.x,tt=n.y,j=n.z;return i[0]=(1-(P+k))*K,i[1]=(_+B)*K,i[2]=(v-V)*K,i[3]=0,i[4]=(_-B)*tt,i[5]=(1-(p+k))*tt,i[6]=(N+U)*tt,i[7]=0,i[8]=(v+V)*j,i[9]=(N-U)*j,i[10]=(1-(p+P))*j,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){let i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];let s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let r=Sn.set(i[0],i[1],i[2]).length(),o=Sn.set(i[4],i[5],i[6]).length(),a=Sn.set(i[8],i[9],i[10]).length();s<0&&(r=-r),Ne.copy(this);let l=1/r,c=1/o,u=1/a;return Ne.elements[0]*=l,Ne.elements[1]*=l,Ne.elements[2]*=l,Ne.elements[4]*=c,Ne.elements[5]*=c,Ne.elements[6]*=c,Ne.elements[8]*=u,Ne.elements[9]*=u,Ne.elements[10]*=u,e.setFromRotationMatrix(Ne),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,i,s,r,o=Hn,a=!1){let l=this.elements,c=2*s/(e-t),u=2*s/(n-i),p=(e+t)/(e-t),_=(n+i)/(n-i),v,P;if(a)v=s/(r-s),P=r*s/(r-s);else if(o===Hn)v=-(r+s)/(r-s),P=-2*r*s/(r-s);else if(o===Us)v=-r/(r-s),P=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=p,l[12]=0,l[1]=0,l[5]=u,l[9]=_,l[13]=0,l[2]=0,l[6]=0,l[10]=v,l[14]=P,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,s,r,o=Hn,a=!1){let l=this.elements,c=2/(e-t),u=2/(n-i),p=-(e+t)/(e-t),_=-(n+i)/(n-i),v,P;if(a)v=1/(r-s),P=r/(r-s);else if(o===Hn)v=-2/(r-s),P=-(r+s)/(r-s);else if(o===Us)v=-1/(r-s),P=-s/(r-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=0,l[12]=p,l[1]=0,l[5]=u,l[9]=0,l[13]=_,l[2]=0,l[6]=0,l[10]=v,l[14]=P,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Sn=new w,Ne=new ae,oa=new w(0,0,0),la=new w(1,1,1),sn=new w,ni=new w,Se=new w,rr=new ae,ar=new $e,vn=class m{constructor(t=0,e=0,n=0,i=m.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let i=t.elements,s=i[0],r=i[4],o=i[8],a=i[1],l=i[5],c=i[9],u=i[2],p=i[6],_=i[10];switch(e){case"XYZ":this._y=Math.asin(bt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,_),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(p,l),this._z=0);break;case"YXZ":this._x=Math.asin(-bt(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,_),this._z=Math.atan2(a,l)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(bt(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-u,_),this._z=Math.atan2(-r,l)):(this._y=0,this._z=Math.atan2(a,s));break;case"ZYX":this._y=Math.asin(-bt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(p,_),this._z=Math.atan2(a,s)):(this._x=0,this._z=Math.atan2(-r,l));break;case"YZX":this._z=Math.asin(bt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-c,l),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,_));break;case"XZY":this._z=Math.asin(-bt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(p,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-c,_),this._y=0);break;default:te("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return rr.makeRotationFromQuaternion(t),this.setFromRotationMatrix(rr,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ar.setFromEuler(this),this.setFromQuaternion(ar,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};vn.DEFAULT_ORDER="XYZ";var Ti=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},ca=0,or=new w,bn=new $e,We=new ae,ii=new w,On=new w,ha=new w,ua=new $e,lr=new w(1,0,0),cr=new w(0,1,0),hr=new w(0,0,1),ur={type:"added"},fa={type:"removed"},wn={type:"childadded",child:null},ss={type:"childremoved",child:null},Ke=class m extends cn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ca++}),this.uuid=jn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=m.DEFAULT_UP.clone();let t=new w,e=new vn,n=new $e,i=new w(1,1,1);function s(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ae},normalMatrix:{value:new yt}}),this.matrix=new ae,this.matrixWorld=new ae,this.matrixAutoUpdate=m.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=m.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ti,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return bn.setFromAxisAngle(t,e),this.quaternion.multiply(bn),this}rotateOnWorldAxis(t,e){return bn.setFromAxisAngle(t,e),this.quaternion.premultiply(bn),this}rotateX(t){return this.rotateOnAxis(lr,t)}rotateY(t){return this.rotateOnAxis(cr,t)}rotateZ(t){return this.rotateOnAxis(hr,t)}translateOnAxis(t,e){return or.copy(t).applyQuaternion(this.quaternion),this.position.add(or.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(lr,t)}translateY(t){return this.translateOnAxis(cr,t)}translateZ(t){return this.translateOnAxis(hr,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(We.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ii.copy(t):ii.set(t,e,n);let i=this.parent;this.updateWorldMatrix(!0,!1),On.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?We.lookAt(On,ii,this.up):We.lookAt(ii,On,this.up),this.quaternion.setFromRotationMatrix(We),i&&(We.extractRotation(i.matrixWorld),bn.setFromRotationMatrix(We),this.quaternion.premultiply(bn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Kt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ur),wn.child=t,this.dispatchEvent(wn),wn.child=null):Kt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(fa),ss.child=t,this.dispatchEvent(ss),ss.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),We.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),We.multiply(t.parent.matrixWorld)),t.applyMatrix4(We),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ur),wn.child=t,this.dispatchEvent(wn),wn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){let r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let i=this.children;for(let s=0,r=i.length;s<r;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(On,t,ha),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(On,ua,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,i=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*i,s[13]+=n-s[1]*e-s[5]*n-s[9]*i,s[14]+=i-s[2]*e-s[6]*n-s[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(o,a){return o[a.uuid]===void 0&&(o[a.uuid]=a.toJSON(t)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let a=o.shapes;if(Array.isArray(a))for(let l=0,c=a.length;l<c;l++){let u=a[l];s(t.shapes,u)}else s(t.shapes,a)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let a=0,l=this.material.length;a<l;a++)o.push(s(t.materials,this.material[a]));i.material=o}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let a=this.animations[o];i.animations.push(s(t.animations,a))}}if(e){let o=r(t.geometries),a=r(t.materials),l=r(t.textures),c=r(t.images),u=r(t.shapes),p=r(t.skeletons),_=r(t.animations),v=r(t.nodes);o.length>0&&(n.geometries=o),a.length>0&&(n.materials=a),l.length>0&&(n.textures=l),c.length>0&&(n.images=c),u.length>0&&(n.shapes=u),p.length>0&&(n.skeletons=p),_.length>0&&(n.animations=_),v.length>0&&(n.nodes=v)}return n.object=i,n;function r(o){let a=[];for(let l in o){let c=o[l];delete c.metadata,a.push(c)}return a}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Ke.DEFAULT_UP=new w(0,1,0);Ke.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ke.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Un=class extends Ke{constructor(){super(),this.isGroup=!0,this.type="Group"}};var Ur={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},rn={h:0,s:0,l:0},si={h:0,s:0,l:0};function rs(m,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?m+(t-m)*6*e:e<1/2?t:e<2/3?m+(t-m)*6*(2/3-e):m}var wt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Ae.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=Ae.workingColorSpace){return this.r=t,this.g=e,this.b=n,Ae.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=Ae.workingColorSpace){if(t=ia(t,1),e=bt(e,0,1),n=bt(n,0,1),e===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+e):n+e-n*e,r=2*n-s;this.r=rs(r,s,t+1/3),this.g=rs(r,s,t),this.b=rs(r,s,t-1/3)}return Ae.colorSpaceToWorking(this,i),this}setStyle(t,e=ye){function n(s){s!==void 0&&parseFloat(s)<1&&te("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s,r=i[1],o=i[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:te("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){let s=i[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);te("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ye){let n=Ur[t.toLowerCase()];return n!==void 0?this.setHex(n,e):te("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Je(t.r),this.g=Je(t.g),this.b=Je(t.b),this}copyLinearToSRGB(t){return this.r=Dn(t.r),this.g=Dn(t.g),this.b=Dn(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ye){return Ae.workingToColorSpace(he.copy(this),t),Math.round(bt(he.r*255,0,255))*65536+Math.round(bt(he.g*255,0,255))*256+Math.round(bt(he.b*255,0,255))}getHexString(t=ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Ae.workingColorSpace){Ae.workingToColorSpace(he.copy(this),e);let n=he.r,i=he.g,s=he.b,r=Math.max(n,i,s),o=Math.min(n,i,s),a,l,c=(o+r)/2;if(o===r)a=0,l=0;else{let u=r-o;switch(l=c<=.5?u/(r+o):u/(2-r-o),r){case n:a=(i-s)/u+(i<s?6:0);break;case i:a=(s-n)/u+2;break;case s:a=(n-i)/u+4;break}a/=6}return t.h=a,t.s=l,t.l=c,t}getRGB(t,e=Ae.workingColorSpace){return Ae.workingToColorSpace(he.copy(this),e),t.r=he.r,t.g=he.g,t.b=he.b,t}getStyle(t=ye){Ae.workingToColorSpace(he.copy(this),t);let e=he.r,n=he.g,i=he.b;return t!==ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(rn),this.setHSL(rn.h+t,rn.s+e,rn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(rn),t.getHSL(si);let n=ji(rn.h,si.h,e),i=ji(rn.s,si.s,e),s=ji(rn.l,si.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},he=new wt;wt.NAMES=Ur;var Ue=new w,Xe=new w,as=new w,qe=new w,En=new w,Tn=new w,fr=new w,os=new w,ls=new w,cs=new w,hs=new Nn,us=new Nn,fs=new Nn,ln=class m{constructor(t=new w,e=new w,n=new w){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Ue.subVectors(t,e),i.cross(Ue);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){Ue.subVectors(i,e),Xe.subVectors(n,e),as.subVectors(t,e);let r=Ue.dot(Ue),o=Ue.dot(Xe),a=Ue.dot(as),l=Xe.dot(Xe),c=Xe.dot(as),u=r*l-o*o;if(u===0)return s.set(0,0,0),null;let p=1/u,_=(l*a-o*c)*p,v=(r*c-o*a)*p;return s.set(1-_-v,v,_)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,qe)===null?!1:qe.x>=0&&qe.y>=0&&qe.x+qe.y<=1}static getInterpolation(t,e,n,i,s,r,o,a){return this.getBarycoord(t,e,n,i,qe)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(s,qe.x),a.addScaledVector(r,qe.y),a.addScaledVector(o,qe.z),a)}static getInterpolatedAttribute(t,e,n,i,s,r){return hs.setScalar(0),us.setScalar(0),fs.setScalar(0),hs.fromBufferAttribute(t,e),us.fromBufferAttribute(t,n),fs.fromBufferAttribute(t,i),r.setScalar(0),r.addScaledVector(hs,s.x),r.addScaledVector(us,s.y),r.addScaledVector(fs,s.z),r}static isFrontFacing(t,e,n,i){return Ue.subVectors(n,e),Xe.subVectors(t,e),Ue.cross(Xe).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ue.subVectors(this.c,this.b),Xe.subVectors(this.a,this.b),Ue.cross(Xe).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return m.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return m.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return m.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return m.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return m.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,i=this.b,s=this.c,r,o;En.subVectors(i,n),Tn.subVectors(s,n),os.subVectors(t,n);let a=En.dot(os),l=Tn.dot(os);if(a<=0&&l<=0)return e.copy(n);ls.subVectors(t,i);let c=En.dot(ls),u=Tn.dot(ls);if(c>=0&&u<=c)return e.copy(i);let p=a*u-c*l;if(p<=0&&a>=0&&c<=0)return r=a/(a-c),e.copy(n).addScaledVector(En,r);cs.subVectors(t,s);let _=En.dot(cs),v=Tn.dot(cs);if(v>=0&&_<=v)return e.copy(s);let P=_*l-a*v;if(P<=0&&l>=0&&v<=0)return o=l/(l-v),e.copy(n).addScaledVector(Tn,o);let N=c*v-_*u;if(N<=0&&u-c>=0&&_-v>=0)return fr.subVectors(s,i),o=(u-c)/(u-c+(_-v)),e.copy(i).addScaledVector(fr,o);let k=1/(N+P+p);return r=P*k,o=p*k,e.copy(n).addScaledVector(En,r).addScaledVector(Tn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Re=class{constructor(t=new w(1/0,1/0,1/0),e=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Fe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Fe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Fe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=s.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,Fe):Fe.fromBufferAttribute(s,r),Fe.applyMatrix4(t.matrixWorld),this.expandByPoint(Fe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ri.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ri.copy(n.boundingBox)),ri.applyMatrix4(t.matrixWorld),this.union(ri)}let i=t.children;for(let s=0,r=i.length;s<r;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Fe),Fe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Bn),ai.subVectors(this.max,Bn),An.subVectors(t.a,Bn),Rn.subVectors(t.b,Bn),Cn.subVectors(t.c,Bn),an.subVectors(Rn,An),on.subVectors(Cn,Rn),gn.subVectors(An,Cn);let e=[0,-an.z,an.y,0,-on.z,on.y,0,-gn.z,gn.y,an.z,0,-an.x,on.z,0,-on.x,gn.z,0,-gn.x,-an.y,an.x,0,-on.y,on.x,0,-gn.y,gn.x,0];return!ds(e,An,Rn,Cn,ai)||(e=[1,0,0,0,1,0,0,0,1],!ds(e,An,Rn,Cn,ai))?!1:(oi.crossVectors(an,on),e=[oi.x,oi.y,oi.z],ds(e,An,Rn,Cn,ai))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Fe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Fe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ye[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ye[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ye[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ye[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ye[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ye[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ye[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ye[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ye),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Ye=[new w,new w,new w,new w,new w,new w,new w,new w],Fe=new w,ri=new Re,An=new w,Rn=new w,Cn=new w,an=new w,on=new w,gn=new w,Bn=new w,ai=new w,oi=new w,_n=new w;function ds(m,t,e,n,i){for(let s=0,r=m.length-3;s<=r;s+=3){_n.fromArray(m,s);let o=i.x*Math.abs(_n.x)+i.y*Math.abs(_n.y)+i.z*Math.abs(_n.z),a=t.dot(_n),l=e.dot(_n),c=n.dot(_n);if(Math.max(-Math.max(a,l,c),Math.min(a,l,c))>o)return!1}return!0}var jt=new w,li=new Wt,da=0,ee=class extends cn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:da++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Dr,this.updateRanges=[],this.gpuType=Ir,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)li.fromBufferAttribute(this,e),li.applyMatrix3(t),this.setXY(e,li.x,li.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)jt.fromBufferAttribute(this,e),jt.applyMatrix3(t),this.setXYZ(e,jt.x,jt.y,jt.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)jt.fromBufferAttribute(this,e),jt.applyMatrix4(t),this.setXYZ(e,jt.x,jt.y,jt.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)jt.fromBufferAttribute(this,e),jt.applyNormalMatrix(t),this.setXYZ(e,jt.x,jt.y,jt.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)jt.fromBufferAttribute(this,e),jt.transformDirection(t),this.setXYZ(e,jt.x,jt.y,jt.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Fn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=xe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Fn(e,this.array)),e}setX(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Fn(e,this.array)),e}setY(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Fn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Fn(e,this.array)),e}setW(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array),i=xe(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array),i=xe(i,this.array),s=xe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Ai=class extends ee{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Ri=class extends ee{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var pe=class extends ee{constructor(t,e,n){super(new Float32Array(t),e,n)}},pa=new Re,zn=new w,ps=new w,Xn=class{constructor(t=new w,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):pa.setFromPoints(t).getCenter(n);let i=0;for(let s=0,r=t.length;s<r;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;zn.subVectors(t,this.center);let e=zn.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(zn,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ps.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(zn.copy(t.center).add(ps)),this.expandByPoint(zn.copy(t.center).sub(ps))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},ma=0,Te=new ae,ms=new Ke,In=new w,be=new Re,kn=new Re,ie=new w,Oe=class m extends cn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ma++}),this.uuid=jn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(jr(t)?Ri:Ai)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new yt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Te.makeRotationFromQuaternion(t),this.applyMatrix4(Te),this}rotateX(t){return Te.makeRotationX(t),this.applyMatrix4(Te),this}rotateY(t){return Te.makeRotationY(t),this.applyMatrix4(Te),this}rotateZ(t){return Te.makeRotationZ(t),this.applyMatrix4(Te),this}translate(t,e,n){return Te.makeTranslation(t,e,n),this.applyMatrix4(Te),this}scale(t,e,n){return Te.makeScale(t,e,n),this.applyMatrix4(Te),this}lookAt(t){return ms.lookAt(t),ms.updateMatrix(),this.applyMatrix4(ms.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(In).negate(),this.translate(In.x,In.y,In.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let i=0,s=t.length;i<s;i++){let r=t[i];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new pe(n,3))}else{let n=Math.min(t.length,e.count);for(let i=0;i<n;i++){let s=t[i];e.setXYZ(i,s.x,s.y,s.z||0)}t.length>e.count&&te("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Re);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Kt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){let s=e[n];be.setFromBufferAttribute(s),this.morphTargetsRelative?(ie.addVectors(this.boundingBox.min,be.min),this.boundingBox.expandByPoint(ie),ie.addVectors(this.boundingBox.max,be.max),this.boundingBox.expandByPoint(ie)):(this.boundingBox.expandByPoint(be.min),this.boundingBox.expandByPoint(be.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Kt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Xn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Kt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new w,1/0);return}if(t){let n=this.boundingSphere.center;if(be.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){let o=e[s];kn.setFromBufferAttribute(o),this.morphTargetsRelative?(ie.addVectors(be.min,kn.min),be.expandByPoint(ie),ie.addVectors(be.max,kn.max),be.expandByPoint(ie)):(be.expandByPoint(kn.min),be.expandByPoint(kn.max))}be.getCenter(n);let i=0;for(let s=0,r=t.count;s<r;s++)ie.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(ie));if(e)for(let s=0,r=e.length;s<r;s++){let o=e[s],a=this.morphTargetsRelative;for(let l=0,c=o.count;l<c;l++)ie.fromBufferAttribute(o,l),a&&(In.fromBufferAttribute(t,l),ie.add(In)),i=Math.max(i,n.distanceToSquared(ie))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Kt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Kt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,i=e.normal,s=e.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==n.count)&&(r=new ee(new Float32Array(4*n.count),4),this.setAttribute("tangent",r));let o=[],a=[];for(let Y=0;Y<n.count;Y++)o[Y]=new w,a[Y]=new w;let l=new w,c=new w,u=new w,p=new Wt,_=new Wt,v=new Wt,P=new w,N=new w;function k(Y,st,it){l.fromBufferAttribute(n,Y),c.fromBufferAttribute(n,st),u.fromBufferAttribute(n,it),p.fromBufferAttribute(s,Y),_.fromBufferAttribute(s,st),v.fromBufferAttribute(s,it),c.sub(l),u.sub(l),_.sub(p),v.sub(p);let gt=1/(_.x*v.y-v.x*_.y);isFinite(gt)&&(P.copy(c).multiplyScalar(v.y).addScaledVector(u,-_.y).multiplyScalar(gt),N.copy(u).multiplyScalar(_.x).addScaledVector(c,-v.x).multiplyScalar(gt),o[Y].add(P),o[st].add(P),o[it].add(P),a[Y].add(N),a[st].add(N),a[it].add(N))}let U=this.groups;U.length===0&&(U=[{start:0,count:t.count}]);for(let Y=0,st=U.length;Y<st;++Y){let it=U[Y],gt=it.start,St=it.count;for(let Mt=gt,Lt=gt+St;Mt<Lt;Mt+=3)k(t.getX(Mt+0),t.getX(Mt+1),t.getX(Mt+2))}let V=new w,B=new w,K=new w,tt=new w;function j(Y){K.fromBufferAttribute(i,Y),tt.copy(K);let st=o[Y];V.copy(st),V.sub(K.multiplyScalar(K.dot(st))).normalize(),B.crossVectors(tt,st);let gt=B.dot(a[Y])<0?-1:1;r.setXYZW(Y,V.x,V.y,V.z,gt)}for(let Y=0,st=U.length;Y<st;++Y){let it=U[Y],gt=it.start,St=it.count;for(let Mt=gt,Lt=gt+St;Mt<Lt;Mt+=3)j(t.getX(Mt+0)),j(t.getX(Mt+1)),j(t.getX(Mt+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new ee(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,_=n.count;p<_;p++)n.setXYZ(p,0,0,0);let i=new w,s=new w,r=new w,o=new w,a=new w,l=new w,c=new w,u=new w;if(t)for(let p=0,_=t.count;p<_;p+=3){let v=t.getX(p+0),P=t.getX(p+1),N=t.getX(p+2);i.fromBufferAttribute(e,v),s.fromBufferAttribute(e,P),r.fromBufferAttribute(e,N),c.subVectors(r,s),u.subVectors(i,s),c.cross(u),o.fromBufferAttribute(n,v),a.fromBufferAttribute(n,P),l.fromBufferAttribute(n,N),o.add(c),a.add(c),l.add(c),n.setXYZ(v,o.x,o.y,o.z),n.setXYZ(P,a.x,a.y,a.z),n.setXYZ(N,l.x,l.y,l.z)}else for(let p=0,_=e.count;p<_;p+=3)i.fromBufferAttribute(e,p+0),s.fromBufferAttribute(e,p+1),r.fromBufferAttribute(e,p+2),c.subVectors(r,s),u.subVectors(i,s),c.cross(u),n.setXYZ(p+0,c.x,c.y,c.z),n.setXYZ(p+1,c.x,c.y,c.z),n.setXYZ(p+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ie.fromBufferAttribute(t,e),ie.normalize(),t.setXYZ(e,ie.x,ie.y,ie.z)}toNonIndexed(){function t(o,a){let l=o.array,c=o.itemSize,u=o.normalized,p=new l.constructor(a.length*c),_=0,v=0;for(let P=0,N=a.length;P<N;P++){o.isInterleavedBufferAttribute?_=a[P]*o.data.stride+o.offset:_=a[P]*c;for(let k=0;k<c;k++)p[v++]=l[_++]}return new ee(p,c,u)}if(this.index===null)return te("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new m,n=this.index.array,i=this.attributes;for(let o in i){let a=i[o],l=t(a,n);e.setAttribute(o,l)}let s=this.morphAttributes;for(let o in s){let a=[],l=s[o];for(let c=0,u=l.length;c<u;c++){let p=l[c],_=t(p,n);a.push(_)}e.morphAttributes[o]=a}e.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,a=r.length;o<a;o++){let l=r[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let l in a)a[l]!==void 0&&(t[l]=a[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let a in n){let l=n[a];t.data.attributes[a]=l.toJSON(t.data)}let i={},s=!1;for(let a in this.morphAttributes){let l=this.morphAttributes[a],c=[];for(let u=0,p=l.length;u<p;u++){let _=l[u];c.push(_.toJSON(t.data))}c.length>0&&(i[a]=c,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let i=t.attributes;for(let l in i){let c=i[l];this.setAttribute(l,c.clone(e))}let s=t.morphAttributes;for(let l in s){let c=[],u=s[l];for(let p=0,_=u.length;p<_;p++)c.push(u[p].clone(e));this.morphAttributes[l]=c}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let l=0,c=r.length;l<c;l++){let u=r[l];this.addGroup(u.start,u.count,u.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let a=t.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var gs=new w,ga=new w,_a=new yt,Ci=class{constructor(t=new w(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let i=gs.subVectors(n,e).cross(ga.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let i=t.delta(gs),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(r<0||r>1)?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||_a.getNormalMatrix(t),i=this.coplanarPoint(gs).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},xa=0,qn=class extends cn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:xa++}),this.uuid=jn(),this.name="",this.type="Material",this.blending=Mr,this.side=zs,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=br,this.blendDst=wr,this.blendEquation=Sr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new wt(0,0,0),this.blendAlpha=0,this.depthFunc=Mi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Lr,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=vi,this.stencilZFail=vi,this.stencilZPass=vi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){te(`Material: parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){te(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){let r=[];for(let o in s){let a=s[o];delete a.metadata,r.push(a)}return r}if(e){let s=i(t.textures),r=i(t.images);s.length>0&&(n.textures=s),r.length>0&&(n.images=r)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new wt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Ci().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Wt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Wt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var Ze=new w,_s=new w,ci=new w,hi=new w,Ii=class{constructor(t=new w,e=new w(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ze)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Ze.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ze.copy(this.origin).addScaledVector(this.direction,e),Ze.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){_s.copy(t).add(e).multiplyScalar(.5),ci.copy(e).sub(t).normalize(),hi.copy(this.origin).sub(_s);let s=t.distanceTo(e)*.5,r=-this.direction.dot(ci),o=hi.dot(this.direction),a=-hi.dot(ci),l=hi.lengthSq(),c=Math.abs(1-r*r),u,p,_,v;if(c>0)if(u=r*a-o,p=r*o-a,v=s*c,u>=0)if(p>=-v)if(p<=v){let P=1/c;u*=P,p*=P,_=u*(u+r*p+2*o)+p*(r*u+p+2*a)+l}else p=s,u=Math.max(0,-(r*p+o)),_=-u*u+p*(p+2*a)+l;else p=-s,u=Math.max(0,-(r*p+o)),_=-u*u+p*(p+2*a)+l;else p<=-v?(u=Math.max(0,-(-r*s+o)),p=u>0?-s:Math.min(Math.max(-s,-a),s),_=-u*u+p*(p+2*a)+l):p<=v?(u=0,p=Math.min(Math.max(-s,-a),s),_=p*(p+2*a)+l):(u=Math.max(0,-(r*s+o)),p=u>0?s:Math.min(Math.max(-s,-a),s),_=-u*u+p*(p+2*a)+l);else p=r>0?-s:s,u=Math.max(0,-(r*p+o)),_=-u*u+p*(p+2*a)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(_s).addScaledVector(ci,p),_}intersectSphere(t,e){if(t.radius<0)return null;Ze.subVectors(t.center,this.origin);let n=Ze.dot(this.direction),i=Ze.dot(Ze)-n*n,s=t.radius*t.radius;if(i>s)return null;let r=Math.sqrt(s-i),o=n-r,a=n+r;return a<0?null:o<0?this.at(a,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,r,o,a,l=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,p=this.origin;return l>=0?(n=(t.min.x-p.x)*l,i=(t.max.x-p.x)*l):(n=(t.max.x-p.x)*l,i=(t.min.x-p.x)*l),c>=0?(s=(t.min.y-p.y)*c,r=(t.max.y-p.y)*c):(s=(t.max.y-p.y)*c,r=(t.min.y-p.y)*c),n>r||s>i||((s>n||isNaN(n))&&(n=s),(r<i||isNaN(i))&&(i=r),u>=0?(o=(t.min.z-p.z)*u,a=(t.max.z-p.z)*u):(o=(t.max.z-p.z)*u,a=(t.min.z-p.z)*u),n>a||o>i)||((o>n||n!==n)&&(n=o),(a<i||i!==i)&&(i=a),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,Ze)!==null}intersectTriangle(t,e,n,i,s){let r=this.origin,o=this.direction,a=o.x,l=o.y,c=o.z,u=t.x-r.x,p=t.y-r.y,_=t.z-r.z,v=e.x-r.x,P=e.y-r.y,N=e.z-r.z,k=n.x-r.x,U=n.y-r.y,V=n.z-r.z,B=Math.abs(a),K=Math.abs(l),tt=Math.abs(c),j,Y,st,it,gt,St,Mt,Lt,et,Bt,It,$t;if(B>=K&&B>=tt?(st=a,St=u,et=v,$t=k,a>=0?(j=l,Y=c,it=p,gt=_,Mt=P,Lt=N,Bt=U,It=V):(j=c,Y=l,it=_,gt=p,Mt=N,Lt=P,Bt=V,It=U)):K>=tt?(st=l,St=p,et=P,$t=U,l>=0?(j=c,Y=a,it=_,gt=u,Mt=N,Lt=v,Bt=V,It=k):(j=a,Y=c,it=u,gt=_,Mt=v,Lt=N,Bt=k,It=V)):(st=c,St=_,et=N,$t=V,c>=0?(j=a,Y=l,it=u,gt=p,Mt=v,Lt=P,Bt=k,It=U):(j=l,Y=a,it=p,gt=u,Mt=P,Lt=v,Bt=U,It=k)),st===0)return null;let zt=j/st,Yt=Y/st,Qt=1/st,ge=it-zt*St,Ce=gt-Yt*St,Be=Mt-zt*et,ke=Lt-Yt*et,dn=Bt-zt*$t,_e=It-Yt*$t,ue=dn*ke-_e*Be,Ie=ge*_e-Ce*dn,ze=Be*Ce-ke*ge;if(i){if(ue<0||Ie<0||ze<0)return null}else if((ue<0||Ie<0||ze<0)&&(ue>0||Ie>0||ze>0))return null;let ot=ue+Ie+ze;if(ot===0)return null;let rt=Qt*(ue*St+Ie*et+ze*$t);return(ot>0?rt<0:rt>0)?null:this.at(rt/ot,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Pi=class extends qn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new vn,this.combine=ks,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},dr=new ae,xn=new Ii,ui=new Xn,pr=new w,fi=new w,di=new w,pi=new w,xs=new w,mi=new w,mr=new w,gi=new w,Yn=class extends Ke{constructor(t=new Oe,e=new Pi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){let o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){let n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(i,t);let o=this.morphTargetInfluences;if(s&&o){mi.set(0,0,0);for(let a=0,l=s.length;a<l;a++){let c=o[a],u=s[a];c!==0&&(xs.fromBufferAttribute(u,t),r?mi.addScaledVector(xs,c):mi.addScaledVector(xs.sub(e),c))}e.add(mi)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ui.copy(n.boundingSphere),ui.applyMatrix4(s),xn.copy(t.ray).recast(t.near),!(ui.containsPoint(xn.origin)===!1&&(xn.intersectSphere(ui,pr)===null||xn.origin.distanceToSquared(pr)>(t.far-t.near)**2))&&(dr.copy(s).invert(),xn.copy(t.ray).applyMatrix4(dr),!(n.boundingBox!==null&&xn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,xn)))}_computeIntersections(t,e,n){let i,s=this.geometry,r=this.material,o=s.index,a=s.attributes.position,l=s.attributes.uv,c=s.attributes.uv1,u=s.attributes.normal,p=s.groups,_=s.drawRange;if(o!==null)if(Array.isArray(r))for(let v=0,P=p.length;v<P;v++){let N=p[v],k=r[N.materialIndex],U=Math.max(N.start,_.start),V=Math.min(o.count,Math.min(N.start+N.count,_.start+_.count));for(let B=U,K=V;B<K;B+=3){let tt=o.getX(B),j=o.getX(B+1),Y=o.getX(B+2);i=_i(this,k,t,n,l,c,u,tt,j,Y),i&&(i.faceIndex=Math.floor(B/3),i.face.materialIndex=N.materialIndex,e.push(i))}}else{let v=Math.max(0,_.start),P=Math.min(o.count,_.start+_.count);for(let N=v,k=P;N<k;N+=3){let U=o.getX(N),V=o.getX(N+1),B=o.getX(N+2);i=_i(this,r,t,n,l,c,u,U,V,B),i&&(i.faceIndex=Math.floor(N/3),e.push(i))}}else if(a!==void 0)if(Array.isArray(r))for(let v=0,P=p.length;v<P;v++){let N=p[v],k=r[N.materialIndex],U=Math.max(N.start,_.start),V=Math.min(a.count,Math.min(N.start+N.count,_.start+_.count));for(let B=U,K=V;B<K;B+=3){let tt=B,j=B+1,Y=B+2;i=_i(this,k,t,n,l,c,u,tt,j,Y),i&&(i.faceIndex=Math.floor(B/3),i.face.materialIndex=N.materialIndex,e.push(i))}}else{let v=Math.max(0,_.start),P=Math.min(a.count,_.start+_.count);for(let N=v,k=P;N<k;N+=3){let U=N,V=N+1,B=N+2;i=_i(this,r,t,n,l,c,u,U,V,B),i&&(i.faceIndex=Math.floor(N/3),e.push(i))}}}};function ya(m,t,e,n,i,s,r,o){let a;if(t.side===vr?a=n.intersectTriangle(r,s,i,!0,o):a=n.intersectTriangle(i,s,r,t.side===zs,o),a===null)return null;gi.copy(o),gi.applyMatrix4(m.matrixWorld);let l=e.ray.origin.distanceTo(gi);return l<e.near||l>e.far?null:{distance:l,point:gi.clone(),object:m}}function _i(m,t,e,n,i,s,r,o,a,l){m.getVertexPosition(o,fi),m.getVertexPosition(a,di),m.getVertexPosition(l,pi);let c=ya(m,t,e,n,fi,di,pi,mr);if(c){let u=new w;ln.getBarycoord(mr,fi,di,pi,u),i&&(c.uv=ln.getInterpolatedAttribute(i,o,a,l,u,new Wt)),s&&(c.uv1=ln.getInterpolatedAttribute(s,o,a,l,u,new Wt)),r&&(c.normal=ln.getInterpolatedAttribute(r,o,a,l,u,new w),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let p={a:o,b:a,c:l,normal:new w,materialIndex:0};ln.getNormal(fi,di,pi,p.normal),c.face=p,c.barycoord=u}return c}var Zn=class extends yn{constructor(t=null,e=1,n=1,i,s,r,o,a,l=Rs,c=Rs,u,p){super(null,r,o,a,l,c,i,s,u,p),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Jn=class m extends Oe{constructor(t=1,e=1,n=1,i=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:r};let o=this;i=Math.floor(i),s=Math.floor(s),r=Math.floor(r);let a=[],l=[],c=[],u=[],p=0,_=0;v("z","y","x",-1,-1,n,e,t,r,s,0),v("z","y","x",1,-1,n,e,-t,r,s,1),v("x","z","y",1,1,t,n,e,i,r,2),v("x","z","y",1,-1,t,n,-e,i,r,3),v("x","y","z",1,-1,t,e,n,i,s,4),v("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(a),this.setAttribute("position",new pe(l,3)),this.setAttribute("normal",new pe(c,3)),this.setAttribute("uv",new pe(u,2));function v(P,N,k,U,V,B,K,tt,j,Y,st){let it=B/j,gt=K/Y,St=B/2,Mt=K/2,Lt=tt/2,et=j+1,Bt=Y+1,It=0,$t=0,zt=new w;for(let Yt=0;Yt<Bt;Yt++){let Qt=Yt*gt-Mt;for(let ge=0;ge<et;ge++){let Ce=ge*it-St;zt[P]=Ce*U,zt[N]=Qt*V,zt[k]=Lt,l.push(zt.x,zt.y,zt.z),zt[P]=0,zt[N]=0,zt[k]=tt>0?1:-1,c.push(zt.x,zt.y,zt.z),u.push(ge/j),u.push(1-Yt/Y),It+=1}}for(let Yt=0;Yt<Y;Yt++)for(let Qt=0;Qt<j;Qt++){let ge=p+Qt+et*Yt,Ce=p+Qt+et*(Yt+1),Be=p+(Qt+1)+et*(Yt+1),ke=p+(Qt+1)+et*Yt;a.push(ge,Ce,ke),a.push(Ce,Be,ke),$t+=6}o.addGroup(_,$t,st),_+=$t,p+=It}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new m(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Li=class m extends Oe{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};let s=[],r=[];o(i),l(n),c(),this.setAttribute("position",new pe(s,3)),this.setAttribute("normal",new pe(s.slice(),3)),this.setAttribute("uv",new pe(r,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(U){let V=new w,B=new w,K=new w;for(let tt=0;tt<e.length;tt+=3)_(e[tt+0],V),_(e[tt+1],B),_(e[tt+2],K),a(V,B,K,U)}function a(U,V,B,K){let tt=K+1,j=[];for(let Y=0;Y<=tt;Y++){j[Y]=[];let st=U.clone().lerp(B,Y/tt),it=V.clone().lerp(B,Y/tt),gt=tt-Y;for(let St=0;St<=gt;St++)St===0&&Y===tt?j[Y][St]=st:j[Y][St]=st.clone().lerp(it,St/gt)}for(let Y=0;Y<tt;Y++)for(let st=0;st<2*(tt-Y)-1;st++){let it=Math.floor(st/2);st%2===0?(p(j[Y][it+1]),p(j[Y+1][it]),p(j[Y][it])):(p(j[Y][it+1]),p(j[Y+1][it+1]),p(j[Y+1][it]))}}function l(U){let V=new w;for(let B=0;B<s.length;B+=3)V.x=s[B+0],V.y=s[B+1],V.z=s[B+2],V.normalize().multiplyScalar(U),s[B+0]=V.x,s[B+1]=V.y,s[B+2]=V.z}function c(){let U=new w;for(let V=0;V<s.length;V+=3){U.x=s[V+0],U.y=s[V+1],U.z=s[V+2];let B=N(U)/2/Math.PI+.5,K=k(U)/Math.PI+.5;r.push(B,1-K)}v(),u()}function u(){for(let U=0;U<r.length;U+=6){let V=r[U+0],B=r[U+2],K=r[U+4],tt=Math.max(V,B,K),j=Math.min(V,B,K);tt>.9&&j<.1&&(V<.2&&(r[U+0]+=1),B<.2&&(r[U+2]+=1),K<.2&&(r[U+4]+=1))}}function p(U){s.push(U.x,U.y,U.z)}function _(U,V){let B=U*3;V.x=t[B+0],V.y=t[B+1],V.z=t[B+2]}function v(){let U=new w,V=new w,B=new w,K=new w,tt=new Wt,j=new Wt,Y=new Wt;for(let st=0,it=0;st<s.length;st+=9,it+=6){U.set(s[st+0],s[st+1],s[st+2]),V.set(s[st+3],s[st+4],s[st+5]),B.set(s[st+6],s[st+7],s[st+8]),tt.set(r[it+0],r[it+1]),j.set(r[it+2],r[it+3]),Y.set(r[it+4],r[it+5]),K.copy(U).add(V).add(B).divideScalar(3);let gt=N(K);P(tt,it+0,U,gt),P(j,it+2,V,gt),P(Y,it+4,B,gt)}}function P(U,V,B,K){K<0&&U.x===1&&(r[V]=U.x-1),B.x===0&&B.z===0&&(r[V]=K/2/Math.PI+.5)}function N(U){return Math.atan2(U.z,-U.x)}function k(U){return Math.atan2(-U.y,Math.sqrt(U.x*U.x+U.z*U.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new m(t.vertices,t.indices,t.radius,t.detail)}};var $n=class m extends Li{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new m(t.radius,t.detail)}};function Fr(m){let t={};for(let e in m){t[e]={};for(let n in m[e]){let i=m[e][n];if(gr(i))i.isRenderTargetTexture?(te("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(gr(i[0])){let s=[];for(let r=0,o=i.length;r<o;r++)s[r]=i[r].clone();t[e][n]=s}else t[e][n]=i.slice();else t[e][n]=i}}return t}function me(m){let t={};for(let e=0;e<m.length;e++){let n=Fr(m[e]);for(let i in n)t[i]=n[i]}return t}function gr(m){return m&&(m.isColor||m.isMatrix3||m.isMatrix4||m.isVector2||m.isVector3||m.isVector4||m.isTexture||m.isQuaternion)}var Di=class extends qn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new wt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new wt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Pr,this.normalScale=new Wt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new vn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},Kn=class extends Di{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Wt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return bt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new wt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new wt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new wt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};function Pn(m,t){return!m||m.constructor===t?m:typeof t.BYTES_PER_ELEMENT=="number"?new t(m):Array.prototype.slice.call(m)}function ys(m){return m!==void 0&&m.inTangents!==void 0&&m.outTangents!==void 0}var hn=class{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,i=e[n],s=e[n-1];n:{t:{let r;e:{i:if(!(t<i)){for(let o=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(s=i,i=e[++n],t<i)break t}r=e.length;break e}if(!(t>=s)){let o=e[1];t<o&&(n=2,s=o);for(let a=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=s,s=e[--n-1],t>=s)break t}r=n,n=0;break e}break n}for(;n<r;){let o=n+r>>>1;t<e[o]?r=o:n=o+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let r=0;r!==i;++r)e[r]=n[s+r];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Ni=class extends hn{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Is,endingEnd:Is}}intervalChanged_(t,e,n){let i=this.parameterPositions,s=t-2,r=t+1,o=i[s],a=i[r];if(o===void 0)switch(this.getSettings_().endingStart){case Ps:s=t,o=2*e-n;break;case Ls:s=i.length-2,o=e+i[s]-i[s+1];break;default:s=t,o=n}if(a===void 0)switch(this.getSettings_().endingEnd){case Ps:r=t,a=2*n-e;break;case Ls:r=1,a=n+i[1]-i[0];break;default:r=t-1,a=e}let l=(n-e)*.5,c=this.valueSize;this._weightPrev=l/(e-o),this._weightNext=l/(a-n),this._offsetPrev=s*c,this._offsetNext=r*c}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=t*o,l=a-o,c=this._offsetPrev,u=this._offsetNext,p=this._weightPrev,_=this._weightNext,v=(n-e)/(i-e),P=v*v,N=P*v,k=-p*N+2*p*P-p*v,U=(1+p)*N+(-1.5-2*p)*P+(-.5+p)*v+1,V=(-1-_)*N+(1.5+_)*P+.5*v,B=_*N-_*P;for(let K=0;K!==o;++K)s[K]=k*r[c+K]+U*r[l+K]+V*r[a+K]+B*r[u+K];return s}},Ui=class extends hn{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=t*o,l=a-o,c=(n-e)/(i-e),u=1-c;for(let p=0;p!==o;++p)s[p]=r[l+p]*u+r[a+p]*c;return s}},Fi=class extends hn{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}},Oi=class extends hn{interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=t*o,l=a-o,c=this.inTangents,u=this.outTangents;if(!c||!u){let v=(n-e)/(i-e),P=1-v;for(let N=0;N!==o;++N)s[N]=r[l+N]*P+r[a+N]*v;return s}let p=o*2,_=t-1;for(let v=0;v!==o;++v){let P=r[l+v],N=r[a+v],k=_*p+v*2,U=u[k],V=u[k+1],B=t*p+v*2,K=c[B],tt=c[B+1],j=Ma(n,e,U,K,i);s[v]=Or(j,P,V,tt,N)}return s}};function Or(m,t,e,n,i){let s=1-m;return s*s*s*t+3*s*s*m*e+3*s*m*m*n+m*m*m*i}function va(m,t,e,n,i){let s=1-m;return 3*s*s*(e-t)+6*s*m*(n-e)+3*m*m*(i-n)}function Ma(m,t,e,n,i){let s=(m-t)/(i-t);for(let r=0;r<8;r++){let o=Or(s,t,e,n,i)-m;if(Math.abs(o)<1e-10)break;let a=va(s,t,e,n,i);if(Math.abs(a)<1e-10)break;s=Math.max(0,Math.min(1,s-o/a))}return s}var we=class{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Pn(e,this.TimeBufferType),this.values=Pn(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Pn(t.times,Array),values:Pn(t.values,Array)};let i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i),ys(t.settings)&&(n.settings={inTangents:Pn(t.settings.inTangents,Array),outTangents:Pn(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Fi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Ui(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ni(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Oi(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Wn:e=this.InterpolantFactoryMethodDiscrete;break;case Si:e=this.InterpolantFactoryMethodLinear;break;case xi:e=this.InterpolantFactoryMethodSmooth;break;case Cs:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return te("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Wn;case this.InterpolantFactoryMethodLinear:return Si;case this.InterpolantFactoryMethodSmooth:return xi;case this.InterpolantFactoryMethodBezier:return Cs}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t;ys(this.settings)&&(_r(this.settings.inTangents,t),_r(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,i=n.length,s=0,r=i-1;for(;s!==i&&n[s]<t;)++s;for(;r!==-1&&n[r]>e;)--r;if(++r,s!==0||r!==i){s>=r&&(r=Math.max(r,1),s=r-1);let o=this.getValueSize();this.times=n.slice(s,r),this.values=this.values.slice(s*o,r*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Kt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,i=this.values,s=n.length;s===0&&(Kt("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==s;o++){let a=n[o];if(typeof a=="number"&&isNaN(a)){Kt("KeyframeTrack: Time is not a valid number.",this,o,a),t=!1;break}if(r!==null&&r>a){Kt("KeyframeTrack: Out of order keys.",this,o,a,r),t=!1;break}r=a}if(i!==void 0&&ta(i))for(let o=0,a=i.length;o!==a;++o){let l=i[o];if(isNaN(l)){Kt("KeyframeTrack: Value is not a valid number.",this,o,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===xi,s=t.length-1,r=1;for(let o=1;o<s;++o){let a=!1,l=t[o],c=t[o+1];if(l!==c&&(o!==1||l!==t[0]))if(i)a=!0;else{let u=o*n,p=u-n,_=u+n;for(let v=0;v!==n;++v){let P=e[u+v];if(P!==e[p+v]||P!==e[_+v]){a=!0;break}}}if(a){if(o!==r){t[r]=t[o];let u=o*n,p=r*n;for(let _=0;_!==n;++_)e[p+_]=e[u+_]}++r}}if(s>0){t[r]=t[s];for(let o=s*n,a=r*n,l=0;l!==n;++l)e[a+l]=e[o+l];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=e.slice(0,r*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,ys(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function _r(m,t){for(let e=0,n=m.length;e!==n;e+=2)m[e]*=t}we.prototype.ValueTypeName="";we.prototype.TimeBufferType=Float32Array;we.prototype.ValueBufferType=Float32Array;we.prototype.DefaultInterpolation=Si;var un=class extends we{constructor(t,e,n){super(t,e,n)}};un.prototype.ValueTypeName="bool";un.prototype.ValueBufferType=Array;un.prototype.DefaultInterpolation=Wn;un.prototype.InterpolantFactoryMethodLinear=void 0;un.prototype.InterpolantFactoryMethodSmooth=void 0;var Bi=class extends we{constructor(t,e,n,i){super(t,e,n,i)}};Bi.prototype.ValueTypeName="color";var zi=class extends we{constructor(t,e,n,i){super(t,e,n,i)}};zi.prototype.ValueTypeName="number";var ki=class extends hn{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=(n-e)/(i-e),l=t*o;for(let c=l+o;l!==c;l+=4)$e.slerpFlat(s,0,r,l-o,r,l,a);return s}},Qn=class extends we{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new ki(this.times,this.values,this.getValueSize(),t)}};Qn.prototype.ValueTypeName="quaternion";Qn.prototype.InterpolantFactoryMethodSmooth=void 0;var fn=class extends we{constructor(t,e,n){super(t,e,n)}};fn.prototype.ValueTypeName="string";fn.prototype.ValueBufferType=Array;fn.prototype.DefaultInterpolation=Wn;fn.prototype.InterpolantFactoryMethodLinear=void 0;fn.prototype.InterpolantFactoryMethodSmooth=void 0;var Vi=class extends we{constructor(t,e,n,i){super(t,e,n,i)}};Vi.prototype.ValueTypeName="vector";var Hi=class{constructor(t,e,n){let i=this,s=!1,r=0,o=0,a,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(c){o++,s===!1&&i.onStart!==void 0&&i.onStart(c,r,o),s=!0},this.itemEnd=function(c){r++,i.onProgress!==void 0&&i.onProgress(c,r,o),r===o&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(c){i.onError!==void 0&&i.onError(c)},this.resolveURL=function(c){return c=c.normalize("NFC"),a?a(c):c},this.setURLModifier=function(c){return a=c,this},this.addHandler=function(c,u){return l.push(c,u),this},this.removeHandler=function(c){let u=l.indexOf(c);return u!==-1&&l.splice(u,2),this},this.getHandler=function(c){for(let u=0,p=l.length;u<p;u+=2){let _=l[u],v=l[u+1];if(_.global&&(_.lastIndex=0),_.test(c))return v}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Br=new Hi,Gi=class{constructor(t){this.manager=t!==void 0?t:Br,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Gi.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ks="\\[\\]\\.:\\/",Sa=new RegExp("["+Ks+"]","g"),Qs="[^"+Ks+"]",ba="[^"+Ks.replace("\\.","")+"]",wa=/((?:WC+[\/:])*)/.source.replace("WC",Qs),Ea=/(WCOD+)?/.source.replace("WCOD",ba),Ta=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Qs),Aa=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Qs),Ra=new RegExp("^"+wa+Ea+Ta+Aa+"$"),Ca=["material","materials","bones","map"],Os=class{constructor(t,e,n){let i=n||qt.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},qt=class m{constructor(t,e,n){this.path=e,this.parsedPath=n||m.parseTrackName(e),this.node=m.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new m.Composite(t,e,n):new m(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Sa,"")}static parseTrackName(t){let e=Ra.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);Ca.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(s){for(let r=0;r<s.length;r++){let o=s[r];if(o.name===e||o.uuid===e)return o;let a=n(o.children);if(a)return a}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,i=e.propertyName,s=e.propertyIndex;if(t||(t=m.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){te("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){Kt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Kt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Kt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let c=0;c<t.length;c++)if(t[c].name===l){l=c;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Kt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Kt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Kt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){Kt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let r=t[i];if(r===void 0){let l=e.nodeName;Kt("PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){Kt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Kt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}a=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=s}else r.fromArray!==void 0&&r.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(a=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};qt.Composite=Os;qt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};qt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};qt.prototype.GetterByBindingType=[qt.prototype._getValue_direct,qt.prototype._getValue_array,qt.prototype._getValue_arrayElement,qt.prototype._getValue_toArray];qt.prototype.SetterByBindingTypeAndVersioning=[[qt.prototype._setValue_direct,qt.prototype._setValue_direct_setNeedsUpdate,qt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[qt.prototype._setValue_array,qt.prototype._setValue_array_setNeedsUpdate,qt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[qt.prototype._setValue_arrayElement,qt.prototype._setValue_arrayElement_setNeedsUpdate,qt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[qt.prototype._setValue_fromArray,qt.prototype._setValue_fromArray_setNeedsUpdate,qt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ic=new Float32Array(1);var Bs=class m{static{m.prototype.isMatrix2=!0}constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){let s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=i,this}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?te("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");var Fa=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Oa=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ba=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,za=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ka=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Va=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ha=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ga=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Wa=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Xa=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,qa=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ya=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Za=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ja=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,$a=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Ka=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Qa=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ja=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,to=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,eo=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,no=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,io=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,so=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,ro=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ao=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,oo=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,lo=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,co=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,ho=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,uo=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,fo="gl_FragColor = linearToOutputTexel( gl_FragColor );",po=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,mo=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,go=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,_o=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,xo=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,yo=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,vo=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Mo=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,So=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,bo=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,wo=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Eo=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,To=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ao=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ro=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Co=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Io=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Po=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Lo=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Do=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,No=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Uo=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Fo=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Oo=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Bo=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,zo=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,ko=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Vo=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ho=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Go=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Wo=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Xo=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,qo=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Yo=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zo=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Jo=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,$o=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Ko=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Qo=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,jo=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,tl=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,el=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,nl=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,il=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,sl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,rl=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,al=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,ol=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,ll=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,cl=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,hl=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,ul=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,fl=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,dl=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,pl=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ml=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,gl=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,_l=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,xl=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,yl=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,vl=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ml=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Sl=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,bl=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,wl=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,El=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Tl=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Al=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Rl=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Cl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Il=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Pl=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Ll=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Dl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Nl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ul=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Fl=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Ol=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Bl=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kl=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Vl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Hl=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gl=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Wl=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Xl=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ql=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Yl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Zl=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jl=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,$l=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Kl=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ql=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jl=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,tc=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ec=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,nc=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ic=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,sc=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,rc=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ac=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,oc=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,lc=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cc=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,hc=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,uc=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,fc=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,dc=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,pc=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,mc=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,gc=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Et={alphahash_fragment:Fa,alphahash_pars_fragment:Oa,alphamap_fragment:Ba,alphamap_pars_fragment:za,alphatest_fragment:ka,alphatest_pars_fragment:Va,aomap_fragment:Ha,aomap_pars_fragment:Ga,batching_pars_vertex:Wa,batching_vertex:Xa,begin_vertex:qa,beginnormal_vertex:Ya,bsdfs:Za,iridescence_fragment:Ja,bumpmap_pars_fragment:$a,clipping_planes_fragment:Ka,clipping_planes_pars_fragment:Qa,clipping_planes_pars_vertex:ja,clipping_planes_vertex:to,color_fragment:eo,color_pars_fragment:no,color_pars_vertex:io,color_vertex:so,common:ro,cube_uv_reflection_fragment:ao,defaultnormal_vertex:oo,displacementmap_pars_vertex:lo,displacementmap_vertex:co,emissivemap_fragment:ho,emissivemap_pars_fragment:uo,colorspace_fragment:fo,colorspace_pars_fragment:po,envmap_fragment:mo,envmap_common_pars_fragment:go,envmap_pars_fragment:_o,envmap_pars_vertex:xo,envmap_physical_pars_fragment:Co,envmap_vertex:yo,fog_vertex:vo,fog_pars_vertex:Mo,fog_fragment:So,fog_pars_fragment:bo,gradientmap_pars_fragment:wo,lightmap_pars_fragment:Eo,lights_lambert_fragment:To,lights_lambert_pars_fragment:Ao,lights_pars_begin:Ro,lights_toon_fragment:Io,lights_toon_pars_fragment:Po,lights_phong_fragment:Lo,lights_phong_pars_fragment:Do,lights_physical_fragment:No,lights_physical_pars_fragment:Uo,lights_fragment_begin:Fo,lights_fragment_maps:Oo,lights_fragment_end:Bo,lightprobes_pars_fragment:zo,logdepthbuf_fragment:ko,logdepthbuf_pars_fragment:Vo,logdepthbuf_pars_vertex:Ho,logdepthbuf_vertex:Go,map_fragment:Wo,map_pars_fragment:Xo,map_particle_fragment:qo,map_particle_pars_fragment:Yo,metalnessmap_fragment:Zo,metalnessmap_pars_fragment:Jo,morphinstance_vertex:$o,morphcolor_vertex:Ko,morphnormal_vertex:Qo,morphtarget_pars_vertex:jo,morphtarget_vertex:tl,normal_fragment_begin:el,normal_fragment_maps:nl,normal_pars_fragment:il,normal_pars_vertex:sl,normal_vertex:rl,normalmap_pars_fragment:al,clearcoat_normal_fragment_begin:ol,clearcoat_normal_fragment_maps:ll,clearcoat_pars_fragment:cl,iridescence_pars_fragment:hl,opaque_fragment:ul,packing:fl,premultiplied_alpha_fragment:dl,project_vertex:pl,dithering_fragment:ml,dithering_pars_fragment:gl,roughnessmap_fragment:_l,roughnessmap_pars_fragment:xl,shadowmap_pars_fragment:yl,shadowmap_pars_vertex:vl,shadowmap_vertex:Ml,shadowmask_pars_fragment:Sl,skinbase_vertex:bl,skinning_pars_vertex:wl,skinning_vertex:El,skinnormal_vertex:Tl,specularmap_fragment:Al,specularmap_pars_fragment:Rl,tonemapping_fragment:Cl,tonemapping_pars_fragment:Il,transmission_fragment:Pl,transmission_pars_fragment:Ll,uv_pars_fragment:Dl,uv_pars_vertex:Nl,uv_vertex:Ul,worldpos_vertex:Fl,background_vert:Ol,background_frag:Bl,backgroundCube_vert:zl,backgroundCube_frag:kl,cube_vert:Vl,cube_frag:Hl,depth_vert:Gl,depth_frag:Wl,distance_vert:Xl,distance_frag:ql,equirect_vert:Yl,equirect_frag:Zl,linedashed_vert:Jl,linedashed_frag:$l,meshbasic_vert:Kl,meshbasic_frag:Ql,meshlambert_vert:jl,meshlambert_frag:tc,meshmatcap_vert:ec,meshmatcap_frag:nc,meshnormal_vert:ic,meshnormal_frag:sc,meshphong_vert:rc,meshphong_frag:ac,meshphysical_vert:oc,meshphysical_frag:lc,meshtoon_vert:cc,meshtoon_frag:hc,points_vert:uc,points_frag:fc,shadow_vert:dc,shadow_frag:pc,sprite_vert:mc,sprite_frag:gc},Q={common:{diffuse:{value:new wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new yt},alphaMap:{value:null},alphaMapTransform:{value:new yt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new yt}},envmap:{envMap:{value:null},envMapRotation:{value:new yt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new yt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new yt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new yt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new yt},normalScale:{value:new Wt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new yt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new yt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new yt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new yt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new w},probesMax:{value:new w},probesResolution:{value:new w}},points:{diffuse:{value:new wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new yt},alphaTest:{value:0},uvTransform:{value:new yt}},sprite:{diffuse:{value:new wt(16777215)},opacity:{value:1},center:{value:new Wt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new yt},alphaMap:{value:null},alphaMapTransform:{value:new yt},alphaTest:{value:0}}},zr={basic:{uniforms:me([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.fog]),vertexShader:Et.meshbasic_vert,fragmentShader:Et.meshbasic_frag},lambert:{uniforms:me([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new wt(0)},envMapIntensity:{value:1}}]),vertexShader:Et.meshlambert_vert,fragmentShader:Et.meshlambert_frag},phong:{uniforms:me([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new wt(0)},specular:{value:new wt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Et.meshphong_vert,fragmentShader:Et.meshphong_frag},standard:{uniforms:me([Q.common,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.roughnessmap,Q.metalnessmap,Q.fog,Q.lights,{emissive:{value:new wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Et.meshphysical_vert,fragmentShader:Et.meshphysical_frag},toon:{uniforms:me([Q.common,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.gradientmap,Q.fog,Q.lights,{emissive:{value:new wt(0)}}]),vertexShader:Et.meshtoon_vert,fragmentShader:Et.meshtoon_frag},matcap:{uniforms:me([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,{matcap:{value:null}}]),vertexShader:Et.meshmatcap_vert,fragmentShader:Et.meshmatcap_frag},points:{uniforms:me([Q.points,Q.fog]),vertexShader:Et.points_vert,fragmentShader:Et.points_frag},dashed:{uniforms:me([Q.common,Q.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Et.linedashed_vert,fragmentShader:Et.linedashed_frag},depth:{uniforms:me([Q.common,Q.displacementmap]),vertexShader:Et.depth_vert,fragmentShader:Et.depth_frag},normal:{uniforms:me([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,{opacity:{value:1}}]),vertexShader:Et.meshnormal_vert,fragmentShader:Et.meshnormal_frag},sprite:{uniforms:me([Q.sprite,Q.fog]),vertexShader:Et.sprite_vert,fragmentShader:Et.sprite_frag},background:{uniforms:{uvTransform:{value:new yt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Et.background_vert,fragmentShader:Et.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new yt}},vertexShader:Et.backgroundCube_vert,fragmentShader:Et.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Et.cube_vert,fragmentShader:Et.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Et.equirect_vert,fragmentShader:Et.equirect_frag},distance:{uniforms:me([Q.common,Q.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Et.distance_vert,fragmentShader:Et.distance_frag},shadow:{uniforms:me([Q.lights,Q.fog,{color:{value:new wt(0)},opacity:{value:1}}]),vertexShader:Et.shadow_vert,fragmentShader:Et.shadow_frag}};zr.physical={uniforms:me([zr.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new yt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new yt},clearcoatNormalScale:{value:new Wt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new yt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new yt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new yt},sheen:{value:0},sheenColor:{value:new wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new yt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new yt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new yt},transmissionSamplerSize:{value:new Wt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new yt},attenuationDistance:{value:0},attenuationColor:{value:new wt(0)},specularColor:{value:new wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new yt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new yt},anisotropyVector:{value:new Wt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new yt}}]),vertexShader:Et.meshphysical_vert,fragmentShader:Et.meshphysical_frag};var _c=new yt;_c.set(-1,0,0,0,1,0,0,0,1);var Cm={[Vs]:"LINEAR_TONE_MAPPING",[Hs]:"REINHARD_TONE_MAPPING",[Gs]:"CINEON_TONE_MAPPING",[Ws]:"ACES_FILMIC_TONE_MAPPING",[qs]:"AGX_TONE_MAPPING",[Ys]:"NEUTRAL_TONE_MAPPING",[Xs]:"CUSTOM_TONE_MAPPING"};var Im=new Float32Array(16),Pm=new Float32Array(9),Lm=new Float32Array(4);var Dm={[Vs]:"Linear",[Hs]:"Reinhard",[Gs]:"Cineon",[Ws]:"ACESFilmic",[qs]:"AgX",[Ys]:"Neutral",[Xs]:"Custom"};var Nm={[xr]:"SHADOWMAP_TYPE_PCF",[yr]:"SHADOWMAP_TYPE_VSM"};var Um={[Ar]:"ENVMAP_TYPE_CUBE",[Js]:"ENVMAP_TYPE_CUBE",[Rr]:"ENVMAP_TYPE_CUBE_UV"};var Fm={[Js]:"ENVMAP_MODE_REFRACTION"};var Om={[ks]:"ENVMAP_BLENDING_MULTIPLY",[Er]:"ENVMAP_BLENDING_MIX",[Tr]:"ENVMAP_BLENDING_ADD"};var xc=new yt;xc.set(-1,0,0,0,1,0,0,0,1);var Bm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);function Vr(m,t=!1){let e=m[0].index!==null,n=new Set(Object.keys(m[0].attributes)),i=new Set(Object.keys(m[0].morphAttributes)),s={},r={},o=m[0].morphTargetsRelative,a=new Oe,l=0;for(let c=0;c<m.length;++c){let u=m[c],p=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let _ in u.attributes){if(!n.has(_))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+'. All geometries must have compatible attributes; make sure "'+_+'" attribute exists among all geometries, or in none of them.'),null;s[_]===void 0&&(s[_]=[]),s[_].push(u.attributes[_]),p++}if(p!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let _ in u.morphAttributes){if(!i.has(_))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+".  .morphAttributes must be consistent throughout all geometries."),null;r[_]===void 0&&(r[_]=[]),r[_].push(u.morphAttributes[_])}if(t){let _;if(e)_=u.index.count;else if(u.attributes.position!==void 0)_=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". The geometry must have either an index or a position attribute"),null;a.addGroup(l,_,c),l+=_}}if(e){let c=0,u=[];for(let p=0;p<m.length;++p){let _=m[p].index;for(let v=0;v<_.count;++v)u.push(_.getX(v)+c);c+=m[p].attributes.position.count}a.setIndex(u)}for(let c in s){let u=kr(s[c]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+c+" attribute."),null;a.setAttribute(c,u)}for(let c in r){let u=r[c][0].length;if(u!==0){a.morphAttributes=a.morphAttributes||{},a.morphAttributes[c]=[];for(let p=0;p<u;++p){let _=[];for(let P=0;P<r[c].length;++P)_.push(r[c][P][p]);let v=kr(_);if(!v)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+c+" morphAttribute."),null;a.morphAttributes[c].push(v)}}}return a}function kr(m){let t,e,n,i=-1,s=0;for(let l=0;l<m.length;++l){let c=m[l];if(t===void 0&&(t=c.array.constructor),t!==c.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=c.itemSize),e!==c.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=c.normalized),n!==c.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=c.gpuType),i!==c.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=c.count*e}let r=new t(s),o=new ee(r,e,n),a=0;for(let l=0;l<m.length;++l){let c=m[l];if(c.isInterleavedBufferAttribute){let u=a/e;for(let p=0,_=c.count;p<_;p++)for(let v=0;v<e;v++){let P=c.getComponent(p,v);o.setComponent(p+u,v,P)}}else r.set(c.array,a);a+=c.count*e}return i!==void 0&&(o.gpuType=i),o}var vc=(()=>{let m={intensity:1,hemi:.12,exposure:1},t={wood:{describe:"timber with visible grain: oak, walnut, pine, plywood, bamboo; bark on a living or fallen tree; the cut end of a log or board",roughness:[.4,.62],metalness:0,tile:.6,size:1024,normal:.4,relief:.4,finishes:{oiled:{roughness:[.4,.62],clearcoat:.18,clearcoatRoughness:.45},lacquered:{roughness:[.3,.45],clearcoat:1,clearcoatRoughness:.08},raw:{roughness:[.66,.86]},bark:{roughness:[.8,.97],pattern:!0,normal:1.1,relief:.9,size:512},endgrain:{roughness:[.62,.82],pattern:!0,normal:.5,relief:.6,tile:.4,size:512}}},metal:{describe:"bare metal: brass, steel, iron, aluminium, copper, chrome",roughness:[.3,.42],metalness:1,tile:.25,size:512,normal:.18,finishes:{brushed:{roughness:[.28,.4],anisotropy:.85},polished:{roughness:[.08,.16]},satin:{roughness:[.42,.55],anisotropy:.3},cast:{roughness:[.55,.75]},rusted:{roughness:[.75,.95],metalness:.35}}},fabric:{describe:"woven or knitted cloth: upholstery, clothing, rugs, curtains, canvas, rope",roughness:[.86,.98],metalness:0,tile:.12,size:512,normal:.5,finishes:{linen:{roughness:[.86,.98],sheen:.45,sheenRoughness:.75},wool:{roughness:[.9,1],sheen:.7,sheenRoughness:.85},velvet:{roughness:[.94,1],sheen:1,sheenRoughness:.5},cotton:{roughness:[.86,.98],sheen:.35,sheenRoughness:.8},denim:{roughness:[.84,.96],sheen:.3,sheenRoughness:.8},canvas:{roughness:[.88,1],sheen:.2,sheenRoughness:.9},knit:{roughness:[.9,1],sheen:.7,sheenRoughness:.85}}},paint:{describe:"an opaque painted or plastered surface over anything: painted wood or metal, walls, lacquer",roughness:[.42,.58],metalness:0,tile:.6,size:256,normal:.3,relief:.3,finishes:{matte:{roughness:[.58,.74]},eggshell:{roughness:[.42,.58]},gloss:{roughness:[.12,.22],clearcoat:.6,clearcoatRoughness:.1}}},ceramic:{describe:"fired clay and porcelain: tiles, crockery, sanitaryware, glazed pots",roughness:[.16,.28],metalness:0,tile:.5,size:256,normal:.12,finishes:{glazed:{roughness:[.14,.24],clearcoat:.8,clearcoatRoughness:.06},matte:{roughness:[.5,.64]}}},leather:{describe:"leather, hide without hair, and bare animal skin such as a nose or paw pad",roughness:[.46,.64],metalness:0,tile:.25,size:512,normal:.7,finishes:{grain:{roughness:[.46,.64],sheen:.15,sheenRoughness:.6},patent:{roughness:[.1,.2],clearcoat:1,clearcoatRoughness:.05,relief:.12}}},rubber:{describe:"rubber and soft matte polymers: tyres, soles, gaskets, grips",roughness:[.7,.86],metalness:0,tile:.2,size:256,normal:.3,finishes:{black:{roughness:[.7,.86]}}},fur:{describe:"the coat of an animal: fur, hair, mane, feathers",roughness:[.7,.92],metalness:0,tile:.16,size:512,normal:.7,body:1.45,bodyClamp:[.18,1.35],finishes:{short:{roughness:[.72,.92],sheen:.6,sheenRoughness:.6},long:{roughness:[.68,.9],sheen:.8,sheenRoughness:.5},plush:{roughness:[.85,1],sheen:1,sheenRoughness:.8},sculpted:{roughness:[.55,.74],relief:.2,sheen:.45,sheenRoughness:.45,sheenWhite:.12}}},keratin:{describe:"hoof, claw, horn, beak, shell, bone, tooth",roughness:[.3,.48],metalness:0,tile:.1,size:256,normal:.25,finishes:{natural:{roughness:[.3,.48],clearcoat:.35,clearcoatRoughness:.3},polished:{roughness:[.12,.22],clearcoat:.9,clearcoatRoughness:.08}}},stone:{describe:"stone, rock, concrete, brick, plaster left rough, slate, marble",roughness:[.78,.96],metalness:0,tile:.45,size:512,normal:.85,finishes:{rough:{roughness:[.8,.97]},concrete:{roughness:[.7,.9]},polished:{roughness:[.12,.28],clearcoat:.5,clearcoatRoughness:.15}}},snow:{describe:"snow, frost, ice crust",roughness:[.8,1],metalness:0,tile:.35,size:256,normal:.45,finishes:{powder:{roughness:[.85,1],sheen:.5,sheenRoughness:.9},ice:{roughness:[.08,.2],clearcoat:.8,clearcoatRoughness:.1}}},foliage:{describe:"living plant matter: leaves, petals, grass, moss, stems, fruit skin; and the CUT-OUT finishes a card wears (spray, needles, grass)",roughness:[.45,.72],metalness:0,tile:.1,size:256,normal:.4,finishes:{leaf:{roughness:[.42,.68],sheen:.25,sheenRoughness:.5},petal:{roughness:[.55,.8],sheen:.5,sheenRoughness:.7},moss:{roughness:[.85,1],sheen:.6,sheenRoughness:.9},spray:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},needles:{roughness:[.72,.94],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},grass:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},core:{roughness:[.92,1],specular:.05,glance:.08,pattern:!0,size:256,tile:.3,normal:.5,crease:80,twoSided:!0}}},soil:{describe:"loose ground: soil, dirt, sand, gravel, mud, ash",roughness:[.88,1],metalness:0,tile:.3,size:512,normal:.9,finishes:{dry:{roughness:[.9,1]},wet:{roughness:[.35,.6]},sand:{roughness:[.85,.98]}}},glass:{describe:"glass and glossy screens, kept SOLID and tinted (never see-through): windows, bottles, lenses, monitor faces",roughness:[.03,.09],metalness:0,tile:.6,size:128,normal:.05,finishes:{clear:{roughness:[.03,.08],clearcoat:1,clearcoatRoughness:.03},frosted:{roughness:[.35,.55]}}},plastic:{describe:"moulded plastic, resin, vinyl, bakelite, acrylic",roughness:[.32,.5],metalness:0,tile:.4,size:256,normal:.15,relief:.3,finishes:{satin:{roughness:[.32,.5]},matte:{roughness:[.55,.72]},gloss:{roughness:[.06,.16],clearcoat:.6,clearcoatRoughness:.08},translucent:{roughness:[.03,.09],clearcoat:1,clearcoatRoughness:.04,transmission:.6,thickness:.012,ior:1.54}}},emissive:{describe:"something that GIVES light: flame, lamp shade when lit, bulb, screen glow, embers, neon",roughness:[.5,.7],metalness:0,tile:.4,size:128,normal:.05,finishes:{glow:{roughness:[.5,.7],emissive:1.4},flame:{roughness:[.6,.8],emissive:2.6,fire:!0,crease:80},screen:{roughness:[.1,.2],emissive:.9,clearcoat:.8,clearcoatRoughness:.05}}},skin:{describe:"bare skin: human skin (natural; soft for a stylised HD face), and the smooth wet skin of sharks, dolphins, whales, fish, eels, frogs and other water animals (wet)",roughness:[.48,.66],metalness:0,tile:.08,size:256,normal:.3,finishes:{natural:{roughness:[.48,.66],sheen:.25,sheenRoughness:.5},wet:{roughness:[.26,.4],relief:.12,clearcoat:.35,clearcoatRoughness:.3},soft:{roughness:[.5,.62],relief:.08,sheen:.18,sheenRoughness:.6}}},paper:{describe:"paper, card, books, cardboard, parchment",roughness:[.82,.96],metalness:0,tile:.2,size:256,normal:.35,relief:.5,finishes:{plain:{roughness:[.82,.96]},glossy:{roughness:[.25,.4]}}}},e=["kind","finish","describe","grain","crease","blend","intensity","must"],n={floor:750,perM2:2e3,exponent:.85,cap:5e4,overFlat:15};function i(h,f=null,d=null){let g=Math.max(0,Number(h?.x)||0),x=Math.max(0,Number(h?.y)||0),S=Math.max(0,Number(h?.z)||0),A=g*x+x*S+g*S,b=Number(d)>0?Math.min(A,Number(d)):A,y=Math.min(n.cap,n.floor+n.perM2*Math.pow(b,n.exponent));return Number(f)>0&&(y=Math.max(n.floor,Math.min(y,n.overFlat*Number(f)))),Math.round(y)}function s(h,f,d){let g=h*374761393+f*668265263+d*1442695041|0;return g=Math.imul(g^g>>>13,1274126177),g^=g>>>16,(g>>>0)/4294967296}let r=h=>h*h*(3-2*h);function o(h,f,d,g,x){let S=Math.floor(h),A=Math.floor(f),b=r(h-S),y=r(f-A),E=(S%d+d)%d,M=(A%g+g)%g,T=(E+1)%d,C=(M+1)%g,I=s(E,M,x),L=s(T,M,x),D=s(E,C,x),z=s(T,C,x);return I+(L-I)*b+(D+(z-D)*b-(I+(L-I)*b))*y}function a(h,f,d,g,x,S=4){let A=0,b=.5,y=0,E=d,M=g;for(let T=0;T<S;T++)A+=b*o(h*E,f*M,E,M,x+T*101),y+=b,b*=.5,E*=2,M*=2;return A/y}function l(h,f,d,g){let x=h*374761393+f*668265263+d*2246822519+g*1442695041|0;return x=Math.imul(x^x>>>13,1274126177),x^=x>>>16,(x>>>0)/4294967296}function c(h,f,d,g=1){let x=Math.floor(h),S=Math.floor(f),A=Math.floor(d),b=r(h-x),y=r(f-S),E=r(d-A),M=(C,I,L)=>l(x+C,S+I,A+L,g),T=(C,I,L)=>C+(I-C)*L;return T(T(T(M(0,0,0),M(1,0,0),b),T(M(0,1,0),M(1,1,0),b),y),T(T(M(0,0,1),M(1,0,1),b),T(M(0,1,1),M(1,1,1),b),y),E)}function u(h,f,d,g=1,x=3){let S=0,A=.5,b=0,y=1;for(let E=0;E<x;E++)S+=A*c(h*y,f*y,d*y,g+E*7),b+=A,A*=.5,y*=2;return S/b}let p={wood(h,f,d){let g=a(h,f,1,4,d+71)-.5,x=a(h,f,2,2,d)-.5,S=f*72+g*4+x*.6,A=.5+.5*Math.sin(2*Math.PI*S),b=.4+1.2*a(h,f,1,6,d+41),y=Math.pow(A,1.5+2.5*b),E=a(h,f,1,2,d+83)-.5,M=.5+.5*Math.sin(2*Math.PI*(f*7+x*1.4+E*.8)),T=Math.pow(M,1.6)*(.5+a(h,f,1,3,d+97)),C=a(h,f,3,128,d+13),I=a(h,f,8,256,d+29),L=a(h,f,1,1,d+3),D=Math.pow(a(h,f,16,3,d+57),6),z=.3*y+.25*T+.3*C+.15*I,H=1-.035*y-.075*T-.04*(C-.5)-.02*(I-.5)-.06*(L-.5)+.03*D,Z=[1,1-.07*T-.03*y,1-.16*T-.06*y];return{h:z,L:H,T:Z,r:.35*y+.3*T+.35*C}},"wood:bark"(h,f,d){let g=a(h,f,2,14,d+5,3),x=a(h,f,4,34,d+29,3),S=Math.abs(2*g-1),A=Math.abs(2*x-1),b=Math.max(0,1-S/.16),y=Math.max(0,1-A/.1),E=Math.max(b*b,.6*y*y),M=a(h,f,9,4,d+11,2),T=a(h,f,40,80,d+17,2),I=.55*Math.pow(Math.min(S/.6,1),.7)*(1-E)+.25*(M-.5)+.2*T,L=.98-.55*E+.14*(M-.5)+.06*(T-.5),D=[1,.95-.1*E,.86-.18*E];return{h:I,L,T:D,r:.45+.55*E+.1*(T-.5)}},"wood:endgrain"(h,f,d){let g=h-.5,x=f-.5,S=Math.hypot(g,x),A=Math.atan2(x,g),b=a(h,f,2,2,d+7)-.5,y=a(h,f,1,1,d+19)-.5,E=S*24+b*1.2+y*2.5,M=.5+.5*Math.sin(2*Math.PI*E),C=Math.pow(M,2.2)*(.5+.8*a(h,f,3,3,d+31,2)),I=Math.pow(Math.max(0,Math.cos(A*7+b*6)),40)*Math.min(1,S*3),L=a(h,f,40,40,d+23),D=.5*C+.3*L-.6*I,z=.93-.12*C-.04*(L-.5)-.3*I+.05*(S<.03?1:0),H=[1,.97-.05*C,.92-.1*C];return{h:D,L:z,T:H,r:.5+.4*C+.1*L}},"foliage:spray"(h,f,d){let g=null;for(let y=0;y<44;y++){let E=.4*Math.pow(s(y,1,d),.6),M=s(y,2,d)*Math.PI*2,T=.5+E*Math.cos(M),C=.5+E*Math.sin(M),I=s(y,3,d)*Math.PI,L=.075+.055*s(y,4,d),D=L*(.42+.2*s(y,5,d)),z=Math.cos(I),H=Math.sin(I),Z=(h-T)*z+(f-C)*H,O=-(h-T)*H+(f-C)*z,W=Z/L;if(Math.abs(W)>1)continue;let G=D*Math.sqrt(1-W*W)*(1-.28*(W+1)/2);Math.abs(O)<G&&(g={i:y,t:W,yn:O/G,w:G,y:O})}if(!g)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let x=.86+.26*s(g.i,6,d),S=Math.abs(g.y)<.045*g.w+.004?1:0,A=Math.pow(Math.abs(g.yn),1.5),b=x*(.98-.12*S+.06*A)*(1-.1*(g.t+1)/2);return{h:.5+.3*(1-Math.abs(g.yn))-.3*S,L:b,T:[1-.05*S,1,1-.08*A],r:.65-.2*S,a:1}},"foliage:needles"(h,f,d){let g=Math.abs(f-.5)<.006&&h>.06&&h<.9,x=null;for(let A=0;A<180;A++){let b=A%2?1:-1,y=.08+.82*s(A,1,d),E=b*(.95+.45*(s(A,2,d)-.5))-.35,M=Math.cos(E),T=Math.sin(E),C=.22+.16*s(A,3,d),I=.013;if(M>.001&&(C=Math.min(C,(.94-y)/M)),Math.abs(T)>.001&&(C=Math.min(C,.44/Math.abs(T))),C<.03)continue;let L=(h-y)*M+(f-.5)*T,D=-(h-y)*T+(f-.5)*M;L<0||L>C||Math.abs(D)>I*(1-.6*L/C)||(x={i:A,t:L/C,yn:D/I})}if(g&&!x)return{h:.6,L:.7,T:[1,.9,.8],r:.8,a:1};if(!x)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let S=.8+.28*s(x.i,4,d);return{h:.5+.3*(1-Math.abs(x.yn)),L:S*(.9+.1*x.t),T:[1,1,1],r:.6,a:1}},"foliage:core"(h,f,d){let g=null;for(let S=0;S<90;S++){let A=s(S,1,d),b=s(S,2,d),y=(h-A+1.5)%1-.5,E=(f-b+1.5)%1-.5,M=s(S,3,d)*Math.PI,T=.09+.06*s(S,4,d),C=T*.45,I=Math.cos(M),L=Math.sin(M),D=y*I+E*L,z=-y*L+E*I,H=D/T;if(Math.abs(H)>1)continue;let Z=C*Math.sqrt(1-H*H);Math.abs(z)<Z&&(g={i:S,t:H,yn:z/Z})}if(!g)return{h:.3,L:.45,T:[1,1,1],r:.9,a:1};let x=.55+.35*s(g.i,6,d);return{h:.5+.3*(1-Math.abs(g.yn)),L:x*(.92+.06*g.t),T:[1,1,1],r:.7,a:1}},"foliage:grass"(h,f,d){let g=null;for(let S=0;S<17;S++){let A=.28+.44*s(S,1,d),b=(s(S,2,d)-.5)*.8,y=.5+.45*s(S,3,d),E=f/y;if(E>1)continue;let M=A+b*E*E,T=.02*(1-E)+.002;Math.abs(h-M)<T&&(g={i:S,t:E,yn:(h-M)/T})}if(!g)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let x=.82+.3*s(g.i,4,d);return{h:.5+.3*(1-Math.abs(g.yn)),L:x*(.86+.18*g.t),T:[1-.05*g.t,1,.9],r:.6,a:1}},metal(h,f,d){let g=a(h,f,1,96,d),x=a(h,f,2,256,d+9),S=a(h,f,5,5,d+3);return{h:.6*g+.25*x+.15*S,L:.955+.045*g,r:.6*g+.2*x+.2*S}},fabric(h,f,d,g){let x=g==="wool"?48:g==="velvet"?80:64,S=Math.abs(Math.sin(Math.PI*h*x)),A=Math.abs(Math.sin(Math.PI*f*x)),b=.5+.5*Math.sin(Math.PI*h*x)*Math.sin(Math.PI*f*x),y=a(h,f,6,6,d),E=a(h,f,2,24,d+5),M=.55*Math.max(S,A)+.25*b+.2*y,T=g==="velvet"?.7*y+.3*M:M+.12*(E-.5),C=.95+.04*Math.max(S,A)-.05*(y-.5)-(g==="linen"?.05*Math.max(0,E-.6):0),I=[1,1-.02*b,1-.04*b];return{h:T,L:C,T:I,r:.5+.5*y}},paint(h,f,d){let g=a(h,f,12,12,d),x=a(h,f,3,3,d+11);return{h:.8*g+.2*x,L:.98+.02*g,r:.9*g+.1*x}},ceramic(h,f,d){let g=a(h,f,4,4,d);return{h:g,L:.985+.015*g,r:g}},leather(h,f,d){let g=a(h,f,18,18,d),x=a(h,f,3,3,d+17);return{h:.75*g+.25*x,L:.94+.06*g-.04*(x-.5),r:.5+.5*g}},rubber(h,f,d){let g=a(h,f,10,10,d);return{h:g,L:.96+.04*g,r:.5+.5*g}},fur(h,f,d,g){let x=g==="long",S=g==="plush",A=x?2:S?6:4,b=x?20:S?24:32,y=h+.06*(a(h,f,3,3,d+31)-.5),E=f+.025*(a(h,f,4,4,d+37)-.5),M=(Math.floor(E*b)%b+b)%b,T=y*A+s(M,7,d)*1.7,C=(Math.floor(T)%A+A)%A,I=T-Math.floor(T),L=E*b-Math.floor(E*b),D=s(C,M,d+3),z=s(M,C,d+5),H=.55+.45*D,Z=I<H?Math.pow(Math.sin(Math.PI*I/H),.6):0,O=Math.pow(Math.sin(Math.PI*L),.8),W=Z*O*(.55+.45*z),G=a(h,f,x?2:4,x?96:192,d),J=a(h,f,2,2,d+21),dt=(S?.4:.6)*W+.4*G,pt=.94+.07*W+.04*(G-.5)-.07*(J-.5),Pt=[1,1-.03*(1-W),1-.06*(1-W)];return{h:dt,L:pt,T:Pt,r:.5*(1-W)+.5*G}},stone(h,f,d,g){let x=a(h,f,3,3,d),S=a(h,f,9,9,d+7),A=Math.pow(a(h,f,28,28,d+15),3),b=g==="concrete"?a(h,f,40,40,d+23):S;return{h:.45*x+.35*b-.35*A,L:.9+.12*(x-.5)+.06*(b-.5)-.1*A,T:[1,1-.02*x,1-.05*x],r:.5*b+.5*x}},snow(h,f,d){let g=a(h,f,3,3,d),x=a(h,f,40,40,d+5);return{h:.7*g+.3*x,L:.96+.04*x,T:[.985,.995,1],r:x}},foliage(h,f,d){let g=Math.pow(Math.abs(Math.sin(Math.PI*f*10+(a(h,f,3,3,d)-.5)*2)),8),x=a(h,f,24,24,d+9);return{h:.6*g+.4*x,L:.93+.07*x-.06*g,T:[1-.04*x,1,1-.06*x],r:.6*x+.4*(1-g)}},soil(h,f,d){let g=a(h,f,8,8,d),x=a(h,f,48,48,d+11),S=Math.pow(a(h,f,16,16,d+19),5);return{h:.5*g+.3*x+.4*S,L:.88+.14*(g-.5)+.08*(x-.5)+.1*S,r:x}},glass(h,f,d){let g=a(h,f,3,3,d);return{h:g,L:.99+.01*g,r:g}},plastic(h,f,d){let g=a(h,f,30,30,d);return{h:g,L:.985+.015*g,r:g}},emissive(h,f,d){let g=a(h,f,4,4,d);return{h:g,L:.97+.03*g,r:g}},skin(h,f,d){let g=a(h,f,48,48,d),x=a(h,f,3,3,d+3);return{h:g,L:.97+.03*(g-.5)-.03*(x-.5),T:[1,1-.015*x,1-.02*x],r:g}},paper(h,f,d){let g=a(h,f,6,60,d),x=a(h,f,5,5,d+7);return{h:.7*g+.3*x,L:.96+.04*(g-.5)-.03*(x-.5),r:g}},keratin(h,f,d){let g=.5+.5*Math.sin(2*Math.PI*(h*6+(a(h,f,2,2,d)-.5)*.8)),x=a(h,f,2,48,d+5);return{h:.5*g+.5*x,L:.95+.05*x-.04*Math.pow(g,3),r:.5*g+.5*x}}},_=globalThis[Symbol.for("polyfork.materials.maps")]??=new Map;_.has("186")||_.set("186",new Map);let v=_.get("186"),P=(h,f)=>{let d=f>>>0;for(let g=0;g<h.length;g++)d=Math.imul(d^h[g],16777619);return(d>>>0).toString(16).padStart(8,"0")},N=h=>P(h,2166136261)+P(h,2538058380);function k(h,f,d,g){let x=N(h),S=`tex:${d?"s":"l"}:${f}:${x}`;if(v.has(S))return v.get(S);let A=new Zn(h,f,f,qi);return A.wrapS=A.wrapT=Gn,A.minFilter=Xi,A.magFilter=Wi,A.generateMipmaps=!0,A.anisotropy=8,d&&(A.colorSpace=ye),A.name=g,A.userData.pfHash=x,A.needsUpdate=!0,v.set(S,A),A}let U=(h,f=null)=>(p[h]||p.paint).length>=4||!!(f&&t[h]&&t[h].finishes[f]&&t[h].finishes[f].pattern);function V(h,f,d){let g=t[h]||t.paint,x=U(h,f),S=`pattern:${h}:${x?f:"*"}:${d}`;if(v.has(S))return v.get(S);let A=g.finishes[f]||{},b=x&&A.size||g.size,y=b*b,E=x&&p[`${h}:${f}`]||p[h]||p.paint,M=new Float32Array(y),T=new Float32Array(y),C=new Uint8Array(y*4),I=new Uint8Array(y*4),L=Z=>Math.max(0,Math.min(1,Z));for(let Z=0;Z<b;Z++)for(let O=0;O<b;O++){let W=Z*b+O,G=E(O/b,Z/b,d,f);M[W]=G.h,T[W]=L(G.r);let J=L(G.L),dt=G.T||[1,1,1];C[W*4]=Math.round(L(J*dt[0])*255),C[W*4+1]=Math.round(L(J*dt[1])*255),C[W*4+2]=Math.round(L(J*dt[2])*255),C[W*4+3]=Math.round(L(G.a??1)*255)}if(C.some((Z,O)=>(O&3)===3&&Z<128)){let Z=new Uint8Array(y);for(let O=0;O<y;O++)Z[O]=C[O*4+3]>=128?1:0;for(let O=0;O<6;O++){let W=[];for(let G=0;G<b;G++)for(let J=0;J<b;J++){let dt=G*b+J;if(Z[dt])continue;let pt=0,Pt=0,kt=0,Zt=0,Rt=0;for(let[Nt,lt]of[[1,0],[-1,0],[0,1],[0,-1]]){let ut=(G+lt+b)%b*b+(J+Nt+b)%b;Z[ut]&&(pt+=M[ut],Pt+=C[ut*4],kt+=C[ut*4+1],Zt+=C[ut*4+2],Rt++)}Rt&&W.push([dt,pt/Rt,Pt/Rt,kt/Rt,Zt/Rt])}if(!W.length)break;for(let[G,J,dt,pt,Pt]of W)M[G]=J,C[G*4]=dt,C[G*4+1]=pt,C[G*4+2]=Pt,Z[G]=1}}let D=(x&&A.normal||g.normal)*b*.02;for(let Z=0;Z<b;Z++)for(let O=0;O<b;O++){let W=Z*b+O,G=(M[Z*b+(O+1)%b]-M[Z*b+(O-1+b)%b])*D,J=(M[(Z+1)%b*b+O]-M[(Z-1+b)%b*b+O])*D,dt=Math.hypot(G,J,1);I[W*4]=Math.round((-G/dt*.5+.5)*255),I[W*4+1]=Math.round((-J/dt*.5+.5)*255),I[W*4+2]=Math.round((1/dt*.5+.5)*255),I[W*4+3]=255}let z=x?`${h}-${f}`:h,H={S:b,R:T,map:k(C,b,!0,`${z}-albedo`),normalMap:k(I,b,!1,`${z}-normal`)};return v.set(S,H),H}function B(h,f=null,d=1){let g=t[h]||t.paint,x=f&&g.finishes[f]?f:Object.keys(g.finishes)[0],S=`${h}:${x}:${d}`;if(v.has(S))return v.get(S);let A=V(h,x,d),[b,y]=g.finishes[x].roughness||g.roughness,E=A.S*A.S,M=new Uint8Array(E*4);for(let C=0;C<E;C++)M[C*4+1]=Math.round((b+(y-b)*A.R[C])*255),M[C*4+2]=255,M[C*4+3]=255;let T={map:A.map,roughnessMap:k(M,A.S,!1,`${h}-${x}-orm`),normalMap:A.normalMap,tile:g.tile};return v.set(S,T),T}function K(h,f,d=""){let g=h&&typeof h=="object"?h:{kind:"paint"},x=t[g.kind]?g.kind:"paint",S=t[x],A=g.finish&&S.finishes[g.finish]?g.finish:Object.keys(S.finishes)[0],b=S.finishes[A],y=B(x,A,g.seed??1),E=new wt(f??"#cccccc"),M=new Kn({color:E,map:y.map,roughnessMap:y.roughnessMap,metalnessMap:y.roughnessMap,roughness:1,metalness:g.metalness??b.metalness??S.metalness,normalMap:y.normalMap,normalScale:new Wt(1,-1).multiplyScalar(g.normal??b.relief??S.relief??1),envMapIntensity:1,vertexColors:!0});return b.sheen&&(M.sheen=b.sheen,M.sheenRoughness=b.sheenRoughness??.7,M.sheenColor=E.clone().lerp(new wt("#ffffff"),(b.sheenWhite??.55)*(g.whiten??1)),M.userData.sheenWhite=(b.sheenWhite??.5)*(g.whiten??1)),b.clearcoat&&(M.clearcoat=b.clearcoat,M.clearcoatRoughness=b.clearcoatRoughness??.1),b.anisotropy&&(M.anisotropy=b.anisotropy,M.anisotropyRotation=0),b.transmission&&(M.transmission=g.transmission??b.transmission,M.thickness=g.thickness??b.thickness??.01,M.ior=b.ior??1.5,M.attenuationColor=E.clone(),M.attenuationDistance=g.attenuationDistance??.03),b.emissive&&(M.emissive=E.clone(),M.emissiveIntensity=g.intensity??b.emissive,M.userData.emits=!0),b.fire&&j(M,g.intensity??b.emissive),b.cutout&&(M.alphaTest=.5,M.alphaToCoverage=!1,M.side=Qe,M.shadowSide=Qe,M.transparent=!1,M.userData.cutout=!0),b.specular!==void 0&&(M.specularIntensity=b.specular),b.glance!==void 0&&gt(M,b.glance),b.twoSided&&(M.side=Qe,M.shadowSide=Qe),M.name=d,M}let tt=globalThis[Symbol.for("polyfork.fires")]||={set:new Set,loop:!1};function j(h,f=2.6){let d={uTime:{value:1.7},uBase:{value:0},uHeight:{value:1},uFire:{value:f}};h.userData.fire=d,h.transparent=!1,h.alphaTest=.5,h.alphaToCoverage=!0,h.side=Qe,h.shadowSide=Qe;let g=h.onBeforeCompile,x=h.customProgramCacheKey;return h.customProgramCacheKey=()=>`${x?x.call(h):""}|pf-fire`,h.onBeforeCompile=(S,A)=>{g&&g.call(h,S,A),Object.assign(S.uniforms,d),S.vertexShader=S.vertexShader.replace("#include <common>",`#include <common>
uniform float uTime; uniform float uBase; uniform float uHeight; varying vec3 vPfPos; varying float vPfH; varying float vPfEdge;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	float pfH = clamp((position.y - uBase) / max(uHeight, 1e-3), 0.0, 1.0);
	float pfS = pfH * pfH * uHeight * 0.10;
	transformed.x += sin(uTime * 6.3 + position.y * 7.0 + position.z * 3.0) * pfS;
	transformed.z += cos(uTime * 5.1 + position.y * 6.0 + position.x * 3.0) * pfS;
	transformed.y += sin(uTime * 8.0 + position.x * 5.0) * pfS * 0.5;
	vPfPos = transformed; vPfH = pfH;
	vPfEdge = abs(dot(normalize(normalMatrix * normal), normalize(-(modelViewMatrix * vec4(transformed, 1.0)).xyz)));   // 1 facing the eye, 0 at the silhouette`),S.fragmentShader=S.fragmentShader.replace("#include <common>",`#include <common>
uniform float uTime; uniform float uFire; uniform float uHeight; varying vec3 vPfPos; varying float vPfH; varying float vPfEdge;
float pfHash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pfNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
	return mix(mix(mix(pfHash(i), pfHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(pfHash(i + vec3(0.0, 1.0, 0.0)), pfHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
	           mix(mix(pfHash(i + vec3(0.0, 0.0, 1.0)), pfHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(pfHash(i + vec3(0.0, 1.0, 1.0)), pfHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float pfFbm(vec3 p) { return 0.5 * pfNoise(p) + 0.25 * pfNoise(p * 2.03 + 11.0) + 0.125 * pfNoise(p * 4.07 + 23.0); }`).replace("#include <map_fragment>",`#include <map_fragment>
	float pfK = 7.0 / max(uHeight, 0.05);                         // the noise scales with the flame, so a torch and a bonfire both lick
	vec3 pfQ = vec3(vPfPos.x * pfK, vPfPos.y * pfK * 0.6 - uTime * 2.6, vPfPos.z * pfK);
	float pfN = pfFbm(pfQ) * 1.14;                                 // 0..1
	float pfBody = pfN * 1.1 - vPfH * 1.05 + 0.55;                 // solid low, ragged and open at the tip
	diffuseColor.a = pfBody * smoothstep(0.04, 0.42, vPfEdge + 0.12 * pfN);   // the alpha test cuts the licks; the silhouette fades, never a facet's straight edge
	float pfHeat = clamp(pfBody * 0.95 + 0.25 * pfN - vPfH * 0.85, 0.0, 1.0);   // hot low in the middle, red and thin at the licks
	vec3 pfRamp = mix(vec3(0.85, 0.12, 0.01), vec3(1.0, 0.48, 0.05), smoothstep(0.18, 0.6, pfHeat));
	pfRamp = mix(pfRamp, vec3(1.0, 0.92, 0.55), smoothstep(0.74, 1.0, pfHeat));
	diffuseColor.rgb = pfRamp * 0.05;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
	totalEmissiveRadiance = pfRamp * uFire * (0.35 + 0.85 * pfHeat);   // red edges glow, the core burns`)},tt.set.add(h),Y(),h}function Y(){if(tt.loop||typeof requestAnimationFrame!="function")return;tt.loop=!0;let h=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches,f=d=>{h||st(d/1e3),requestAnimationFrame(f)};requestAnimationFrame(f)}function st(h){for(let f of tt.set){let d=f.userData.fire;d&&(d.uTime.value=h)}}function it(h){let f=[];if(h.updateMatrixWorld(!0),h.traverse(y=>{if(!y.isMesh||!y.geometry)return;let E=[].concat(y.material||[]).map(T=>T&&T.userData.fire).filter(Boolean);if(!E.length)return;y.geometry.boundingBox||y.geometry.computeBoundingBox();let M=y.geometry.boundingBox.clone().applyMatrix4(y.matrixWorld);y.castShadow=!1,y.receiveShadow=!1,f.push({o:y,us:E,wb:M})}),!f.length)return 0;let d=f.map((y,E)=>E),g=y=>{for(;d[y]!==y;)d[y]=d[d[y]],y=d[y];return y};for(let y=0;y<f.length;y++)for(let E=y+1;E<f.length;E++){let M=f[y].wb.clone().expandByScalar(.1*f[y].wb.getSize(new w).length()),T=f[E].wb;if(M.intersectsBox(T)){let C=g(y),I=g(E);C!==I&&(d[C]=I)}}let x=new Map;f.forEach((y,E)=>{let M=g(E);x.has(M)?x.get(M).union(y.wb):x.set(M,y.wb.clone())});let S=new ae,A=new w,b=new w;return f.forEach((y,E)=>{let M=x.get(g(E)),T=M.getCenter(new w);S.copy(y.o.matrixWorld).invert(),A.set(T.x,M.min.y,T.z).applyMatrix4(S),b.set(T.x,M.max.y,T.z).applyMatrix4(S);for(let C of y.us)C.uBase.value=Math.min(A.y,b.y),C.uHeight.value=Math.max(.02,Math.abs(b.y-A.y))}),f.length}function gt(h,f){let d=h.onBeforeCompile,g=h.customProgramCacheKey,x=Number(f).toFixed(3);h.customProgramCacheKey=()=>`${g?g.call(h):""}|pf-glance-${x}`,h.onBeforeCompile=(S,A)=>{d&&d.call(h,S,A),S.fragmentShader=S.fragmentShader.replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
	reflectedLight.directSpecular *= ${x};
	reflectedLight.indirectSpecular *= ${x};`)},h.userData.glance=f}function St(h,f=.5,d=null,g=0){let S=h.attributes.position.count,A=new Float32Array(S*2);return Mt(h,A,0,S,f,d,g)}function Mt(h,f,d,g,x=.5,S=null,A=0,b=null){let y=h.attributes.position,E=d+g,M=new w,T=new w,C=new w,I=new w,L=1/x;if(Array.isArray(S)&&S.length===3){let D=new w(S[0],S[1],S[2]).normalize(),z=new w;for(let H=d;H<E;H+=3){M.fromBufferAttribute(y,H),T.fromBufferAttribute(y,H+1),C.fromBufferAttribute(y,H+2),I.subVectors(T,M).cross(C.clone().sub(M)).normalize(),z.crossVectors(I,D),z.lengthSq()<1e-8&&z.set(1,0,0).cross(D),z.normalize();for(let Z=0;Z<3;Z++){let O=Z===0?M:Z===1?T:C;f[(H+Z)*2]=O.dot(D)*L+A,f[(H+Z)*2+1]=O.dot(z)*L+A*.37}}return h.setAttribute("uv",new ee(f,2)),h}for(let D=d;D<E;D+=3){M.fromBufferAttribute(y,D),T.fromBufferAttribute(y,D+1),C.fromBufferAttribute(y,D+2),I.subVectors(T,M).cross(C.clone().sub(M));let z=Math.abs(I.x),H=Math.abs(I.y),Z=Math.abs(I.z),O;z>=H&&z>=Z?O=S==="z"?["z","y"]:["y","z"]:H>=Z?O=S==="z"?["z","x"]:["x","z"]:O=S==="x"?["x","y"]:["y","x"];for(let W=0;W<3;W++){let G=W===0?M:W===1?T:C;f[(D+W)*2]=G[O[0]]*L+A,f[(D+W)*2+1]=G[O[1]]*L+A*.37}}return h.setAttribute("uv",new ee(f,2)),h}function Lt(h,f=30){let d=h.attributes.position,g=d.count,x=g/3,S=new Float32Array(x*3),A=new Float32Array(x),b=new w,y=new w,E=new w,M=new w;for(let D=0;D<x;D++){b.fromBufferAttribute(d,D*3),y.fromBufferAttribute(d,D*3+1),E.fromBufferAttribute(d,D*3+2),M.subVectors(y,b).cross(E.clone().sub(b));let z=M.length();A[D]=z,z>1e-14&&M.divideScalar(z),S[D*3]=M.x,S[D*3+1]=M.y,S[D*3+2]=M.z}let T=1e4,C=new Map;for(let D=0;D<g;D++){let z=`${Math.round(d.getX(D)*T)},${Math.round(d.getY(D)*T)},${Math.round(d.getZ(D)*T)}`,H=C.get(z);H||(H=[],C.set(z,H)),H.push(D)}let I=Math.cos(f*Math.PI/180),L=new Float32Array(g*3);for(let D of C.values())for(let z of D){let H=z/3|0,Z=S[H*3],O=S[H*3+1],W=S[H*3+2],G=0,J=0,dt=0;for(let Pt of D){let kt=Pt/3|0,Zt=S[kt*3],Rt=S[kt*3+1],Nt=S[kt*3+2];Z*Zt+O*Rt+W*Nt<I||(G+=Zt*A[kt],J+=Rt*A[kt],dt+=Nt*A[kt])}let pt=Math.hypot(G,J,dt);pt<1e-12?(G=Z,J=O,dt=W):(G/=pt,J/=pt,dt/=pt),L[z*3]=G,L[z*3+1]=J,L[z*3+2]=dt}return h.setAttribute("normal",new ee(L,3)),h}function et(h,{amp:f=.004,scale:d=.12,seed:g=1}={}){Lt(h,180);let x=h.attributes.position,S=h.attributes.normal,A=x.count,b=1/d;for(let y=0;y<A;y++){let E=x.getX(y),M=x.getY(y),T=x.getZ(y),C=(u(E*b,M*b,T*b,g)-.5)*2*f;x.setXYZ(y,E+S.getX(y)*C,M+S.getY(y)*C,T+S.getZ(y)*C)}return h.deleteAttribute("normal"),h}function Bt(h,f=[]){let d=h.index?h.toNonIndexed():h;d===h&&(d=h.clone());for(let g of Object.keys(d.attributes))g!=="position"&&!f.includes(g)&&d.deleteAttribute(g);return d}function It(h){let f=t[h.kind]||t.paint,d=f.finishes[h.finish]||{};return h.tile??d.tile??f.tile}function $t(h,{name:f="part",colors:d={},materials:g={},crease:x=30}={}){let S=new Map;for(let b of h){if(!b||!b.g)continue;let y=b.zone??"body",E=g[y]||{kind:"paint"};S.has(y)||S.set(y,[]);let M=b.uv==="own"&&b.g.getAttribute("uv")?Bt(b.g,["uv"]):St(Bt(b.g),It(E),b.grain??E.grain??null,b.shift??0),T=Math.max(.2,Math.min(1.25,b.tone??1)),C=M.attributes.position.count,I=new Float32Array(C*3).fill(T);M.setAttribute("color",new ee(I,3)),S.get(y).push(M)}let A=new Un;A.name=f;for(let[b,y]of S){let E=g[b]||{kind:"paint"},M=y.length===1?y[0]:Vr(y),T=t[E.kind]&&t[E.kind].finishes[E.finish]?t[E.kind].finishes[E.finish].crease:void 0;Lt(M,T!==void 0?Math.max(E.crease??0,T):E.crease??x);let C=new Yn(M,K(E,d[b],b));C.name=`${f}-${b}`,C.castShadow=C.receiveShadow=!0,A.add(C)}return it(A),A}function zt(h,f,d=null){return!(f?.transmission>0)||!("transmission"in h)||(h.transmission=f.transmission,h.thickness=f.thickness??0,h.ior=f.ior??1.5,f.attenuationColor&&h.attenuationColor.copy(f.attenuationColor),h.attenuationDistance=f.attenuationDistance??1/0,h.normalMap=null,h.roughnessMap=null,h.metalnessMap=null,h.roughness=Math.min(h.roughness,.08),h.metalness=0,h.side=Qe,h.needsUpdate=!0,d&&(d.castShadow=!1,d.renderOrder=Math.max(d.renderOrder,1))),h}function Yt(h,f={},{force:d=!1,cache:g=null}={}){let x=0;return h.traverse(S=>{if(!S.isMesh||!S.material)return;let b=(Array.isArray(S.material)?S.material:[S.material]).map(y=>{if(!y||!y.name||!f[y.name]||!d&&y.map)return y;let E=y.userData&&y.userData.authoredColor,T="#"+(E?new wt().fromArray(E.baseColorFactor):y.color).getHexString(),C=!!S.geometry.attributes.color,I=E&&C?E.vertexScale:null,L=y.transmission>0?"|t"+y.transmission:"",D=y.name+"|"+T+"|"+C+L+(I?"|"+I.join(","):""),z=g&&g.get(D);return z||(z=zt(K(f[y.name],T,y.name),y),z.vertexColors=C,I&&(z.color.multiply(new wt().fromArray(I)),z.userData.vertexScale=I),g&&(g.set(D,z),z.dispose=()=>{})),L&&zt(z,y,S),x++,z});S.material=Array.isArray(S.material)?b:b[0]}),x&&it(h),x}let Qt=[[/\b(flame|fire|ember|glow|bulb|neon|lit|lamp ?light|led)\b/,{kind:"emissive",finish:"glow"}],[/\b(screen|display|monitor face)\b/,{kind:"glass",finish:"clear"}],[/\b(window|pane|glass|bottle|lens|visor|windscreen)\b/,{kind:"glass",finish:"clear"}],[/\b(snow|frost|ice)\b/,{kind:"snow",finish:"powder"}],[/\b(leaf|leaves|petal|grass|moss|stem|vine|foliage|frond|needles?|blossom|bloom|flower)\b/,{kind:"foliage",finish:"leaf"}],[/\b(soil|dirt|sand|gravel|mud|earth|ground|ash)\b/,{kind:"soil",finish:"dry"}],[/\b(stone|rock|concrete|brick|slate|marble|granite|cobble|plinth|masonry|mortar|cement)\b/,{kind:"stone",finish:"rough"}],[/\b(skin|face|hand|arm|leg flesh|brow|cheek|neck)\b/,{kind:"skin",finish:"natural"}],[/\b(denim|jeans)\b/,{kind:"fabric",finish:"denim"}],[/\b(shirt|blouse|dress|skirt|trousers|pants|briefs|bra|sock|cuff|collar|waistband|sleeve|apron|robe|tunic|cloak|scarf|hat band)\b/,{kind:"fabric",finish:"cotton"}],[/\b(jumper|sweater|knit|beanie)\b/,{kind:"fabric",finish:"knit"}],[/\b(sole|tread|tyre|tire)\b/,{kind:"rubber",finish:"black"}],[/\b(paper|book|page|card|cardboard|label|poster|parchment)\b/,{kind:"paper",finish:"plain"}],[/\b(plastic|vinyl|resin|acrylic|bakelite)\b/,{kind:"plastic",finish:"satin"}],[/\b(eye|pupil|iris|lens|glass|glaze|porcelain|ceramic|enamel)\b/,{kind:"ceramic",finish:"glazed"}],[/\b(hoof|hooves|claw|talon|horn|antler|beak|bill|nail|tusk|tooth|teeth|shell|carapace)\b/,{kind:"keratin",finish:"natural"}],[/\b(mane|tail|hair|feather|beard|whisker|brush)\b/,{kind:"fur",finish:"long"}],[/\b(nose|snout|muzzle pad|tongue|lid|lip|pad|skin|inner ear|inner)\b/,{kind:"leather",finish:"grain"}],[/\b(fur|coat|hide|pelt|fleece|wool(?!len)|points|blaze|belly|bib|cream|markings?|flank|sock|cape|ruff|mask)\b/,{kind:"fur",finish:"short"}],[/\b(brass|bronze|copper|gold|steel|iron|chrome|alumin|metal|tin|zinc|rod|rail|bolt|rivet|chain|wire)\b/,{kind:"metal",finish:"brushed"}],[/\b(oak|walnut|ash|pine|timber|wood|plank|board|beam|bamboo|plywood)\b/,{kind:"wood",finish:"oiled"}],[/\b(leather|saddle|strap|harness|belt|boot)\b/,{kind:"leather",finish:"grain"}],[/\b(linen|wool|cotton|canvas|fabric|cloth|cushion|upholster|sail|rug|blanket|curtain|towel|rope|cord)\b/,{kind:"fabric",finish:"linen"}],[/\b(rubber|tyre|tire|gasket)\b/,{kind:"rubber",finish:"black"}],[/\b(tile|sink|basin|bath|toilet|crockery|mug|plate)\b/,{kind:"ceramic",finish:"glazed"}]];function ge(h={}){let f={};for(let[d,g]of Object.entries(h)){if(!g||g.type!=="color")continue;let x=`${d} ${g.label||""} ${g.describe||""}`.toLowerCase().replace(/_/g," "),S=`${d} ${g.label||""}`.toLowerCase(),A=null;for(let[b,y]of Qt)if(b.test(S)){A=y;break}if(!A){for(let[b,y]of Qt)if(b.test(x)){A=y;break}}f[d]={...A||{kind:"paint",finish:"matte"},guessed:!0}}return f}let Ce={fur:1,skin:.6,foliage:.8,soil:1,snow:1},Be={ofSize:.022,min:.003,max:.045};function ke(h,f,d,g){let x=h.attributes.position,S=x.count,A=S/3;if(d.filter(I=>I>0).length<2)return null;let b=new Uint32Array(S),y=new Map;for(let I=0;I<S;I++){let L=`${Math.round(x.getX(I)*1e4)},${Math.round(x.getY(I)*1e4)},${Math.round(x.getZ(I)*1e4)}`,D=y.get(L);D===void 0&&(D=y.size,y.set(L,D)),b[I]=D}let E=new Map;for(let I=0;I<A;I++){let L=f[I];if(d[L]>0)for(let D=0;D<3;D++){let z=I*3+D,H=I*3+(D+1)%3,Z=b[z],O=b[H],W=Z<O?Z*4294967296+O:O*4294967296+Z,G=E.get(W);G||(G={i0:z,i1:H,zones:[],room:1/0},E.set(W,G)),G.zones.includes(L)||G.zones.push(L);let J=I*3+(D+2)%3,dt=x.getX(H)-x.getX(z),pt=x.getY(H)-x.getY(z),Pt=x.getZ(H)-x.getZ(z),kt=x.getX(J)-x.getX(z),Zt=x.getY(J)-x.getY(z),Rt=x.getZ(J)-x.getZ(z),Nt=pt*Rt-Pt*Zt,lt=Pt*kt-dt*Rt,ut=dt*Zt-pt*kt,Ut=Math.sqrt(Nt*Nt+lt*lt+ut*ut)/(Math.sqrt(dt*dt+pt*pt+Pt*Pt)||1e-9);Ut<G.room&&(G.room=Ut)}}let M=new Map;for(let I of E.values()){if(I.zones.length<2)continue;let L={ax:x.getX(I.i0),ay:x.getY(I.i0),az:x.getZ(I.i0),bx:x.getX(I.i1),by:x.getY(I.i1),bz:x.getZ(I.i1)};for(let D of I.zones){let z=I.zones.find(Z=>Z!==D);M.has(D)||M.set(D,[]);let H=Math.max(1e-4,Math.min(g,I.room*.5));M.get(D).push({...L,other:z,gain:Math.min(d[D],d[z]),scale:g/H})}}if(!M.size)return null;let T=new Float32Array(S*3),C=new Map;for(let I=0;I<S;I++){let L=f[I/3|0],D=M.get(L);if(!D){T[I*3]=1e3,T[I*3+1]=L;continue}let z=b[I]*64+L,H=C.get(z);if(!H){let Z=x.getX(I),O=x.getY(I),W=x.getZ(I),G=1/0,J=L,dt=0;for(let pt of D){let Pt=pt.bx-pt.ax,kt=pt.by-pt.ay,Zt=pt.bz-pt.az,Rt=Pt*Pt+kt*kt+Zt*Zt||1e-12,Nt=((Z-pt.ax)*Pt+(O-pt.ay)*kt+(W-pt.az)*Zt)/Rt;Nt=Nt<0?0:Nt>1?1:Nt;let lt=Z-(pt.ax+Pt*Nt),ut=O-(pt.ay+kt*Nt),Ut=W-(pt.az+Zt*Nt),Ot=(lt*lt+ut*ut+Ut*Ut)*pt.scale*pt.scale;Ot<G&&(G=Ot,J=pt.other,dt=pt.gain)}H=[Math.sqrt(G),J,dt],C.set(z,H)}T[I*3]=H[0],T[I*3+1]=H[1],T[I*3+2]=H[2]}return T}function dn(h,f){h.defines={...h.defines||{},PF_BLEND_ZONES:f.count},h.customProgramCacheKey=()=>`pf-blend-${f.count}`,h.onBeforeCompile=d=>{d.uniforms.uPfZone=f.zone,d.uniforms.uPfBand=f.band,d.vertexShader=d.vertexShader.replace("#include <common>",`#include <common>
attribute vec3 aPfBlend;
uniform vec3 uPfZone[PF_BLEND_ZONES];
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_vertex>",`#include <color_vertex>
vPfOther = uPfZone[int(aPfBlend.y + 0.5)];
vPfBlend = aPfBlend.xz;`),d.fragmentShader=d.fragmentShader.replace("#include <common>",`#include <common>
uniform float uPfBand;
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_fragment>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
  { float pfT = 0.5 * vPfBlend.y * ( 1.0 - smoothstep( 0.0, uPfBand, vPfBlend.x ) );
    diffuseColor.rgb *= mix( vColor.rgb, vPfOther, pfT );
    #ifdef USE_COLOR_ALPHA
      diffuseColor.a *= vColor.a;
    #endif
  }
#endif`)},h.onBeforeRender=(d,g,x,S)=>{let A=d.info.render.frame;if(f.frame===A&&f.geo===S)return;f.frame=A,f.geo=S;let b=S.attributes.color;if(b)for(let y=0;y<f.count;y++){let E=f.rep[y];E>=0&&f.zone.value[y].set(b.getX(E),b.getY(E),b.getZ(E))}},h.needsUpdate=!0}function _e(h,f={},d={},{force:g=!1,smooth:x="auto",blend:S="auto"}={}){let A=Object.keys(f).filter(E=>d[E]);if(!A.length)return 0;let b=A.map(E=>new wt(f[E])),y=0;return h.traverse(E=>{if(!E.isMesh||!E.geometry||Array.isArray(E.material))return;let M=E.material;if(!M||!M.vertexColors||!g&&M.map)return;let T=E.geometry;T.index&&(T=T.toNonIndexed(),E.geometry.dispose(),E.geometry=T);let C=T.attributes.color,I=T.attributes.position;if(!C||!I)return;let L=I.count/3;T.computeBoundingBox();let D=T.boundingBox,z=D.max.z-D.min.z>D.max.x-D.min.x?"z":"x",H=Math.max(D.max.x-D.min.x,D.max.y-D.min.y,D.max.z-D.min.z)||1,Z=lt=>Math.max(lt.bodyClamp[0],Math.min(lt.bodyClamp[1],H/lt.body)),O=new Uint8Array(L),W=new Array(A.length).fill(0);for(let lt=0;lt<L;lt++){let ut=0,Ut=0,Xt=0;for(let se=0;se<3;se++)ut+=C.getX(lt*3+se),Ut+=C.getY(lt*3+se),Xt+=C.getZ(lt*3+se);ut/=3,Ut/=3,Xt/=3;let Ot=0,fe=1/0;for(let se=0;se<b.length;se++){let Pe=b[se],je=(Pe.r-ut)**2+(Pe.g-Ut)**2+(Pe.b-Xt)**2;je<fe&&(fe=je,Ot=se)}O[lt]=Ot,W[Ot]++}let G=new Uint32Array(L*3),J=[],dt=0;for(let lt=0;lt<A.length;lt++)J.push(dt),dt+=W[lt]*3;let pt=J.slice(),Pt=new Float32Array(I.count*2);for(let lt=0;lt<L;lt++){let ut=O[lt],Ut=J[ut];G[Ut]=lt*3,G[Ut+1]=lt*3+1,G[Ut+2]=lt*3+2,J[ut]+=3;let Xt=d[A[ut]],Ot=t[Xt.kind]||t.paint;Mt(T,Pt,lt*3,3,Xt.tile??((Ot.finishes[Xt.finish]||{}).tile??Ot.tile)*(Ot.body?Z(Ot):1),Xt.grain??z)}T.setAttribute("uv",new ee(Pt,2));let kt=x==="auto"?E.isSkinnedMesh?55:35:x;kt&&Lt(T,kt);let Zt=S==="auto"||S===!0?1:Math.max(0,Math.min(4,Number(S)||0)),Rt=null;if(Zt>0){let lt=A.map(Ot=>Math.max(0,Math.min(1,Number(d[Ot].blend??Ce[d[Ot].kind]??0)))),ut=new w;D.getSize(ut);let Ut=Math.max(Be.min,Math.min(Be.max,ut.length()*Be.ofSize))*Zt,Xt=ke(T,O,lt,Ut);if(Xt){T.setAttribute("aPfBlend",new ee(Xt,3));let Ot=A.map(()=>-1);for(let fe=0;fe<L;fe++)Ot[O[fe]]<0&&(Ot[O[fe]]=fe*3);Rt={count:A.length,rep:Ot,band:{value:Ut},zone:{value:A.map(fe=>new w().setFromColor(new wt(f[fe])))},frame:-1,geo:null},T.userData.blendBand=Ut}}T.setIndex(new ee(G,1)),T.clearGroups();let Nt=[];for(let lt=0;lt<A.length;lt++){if(!W[lt])continue;T.addGroup(pt[lt],W[lt]*3,Nt.length);let ut=K(d[A[lt]],"#ffffff",A[lt]);ut.vertexColors=!0,ut.flatShading=kt?!1:!!M.flatShading,ut.sheen&&(ut.sheenColor=new wt(f[A[lt]]).lerp(new wt("#ffffff"),ut.userData.sheenWhite??.5)),ut.userData.emits&&(ut.emissive=new wt(f[A[lt]])),M.side!==void 0&&(ut.side=M.side),Rt&&dn(ut,Rt),Nt.push(ut)}E.material=Nt,y++}),y}function ue(h,f,d=18,g=!1){let x=g?[...h,h[0]]:h,S=x.length,A=[];for(let T=0;T<S;T++){let C=g?x[(T-1+S-1)%(S-1)]:x[Math.max(0,T-1)],I=g?x[(T+1)%(S-1)]:x[Math.min(S-1,T+1)];A.push(new w().subVectors(I,C).normalize())}let b=new w(1,0,0);Math.abs(b.dot(A[0]))>.9&&b.set(0,1,0);let y=[];for(let T=0;T<S;T++){let C=A[T];b=b.clone().addScaledVector(C,-b.dot(C)).normalize();let I=new w().crossVectors(C,b).normalize(),L=[];for(let D=0;D<d;D++){let z=(D+.5)/d*Math.PI*2,H=x[T].clone().addScaledVector(b,Math.cos(z)*f).addScaledVector(I,Math.sin(z)*f);L.push([H.x,H.y,H.z])}y.push(L)}g&&(y[S-1]=y[0]);let E=[],M=(T,C,I)=>E.push(T[0],T[1],T[2],C[0],C[1],C[2],I[0],I[1],I[2]);for(let T=0;T<S-1;T++){let C=y[T],I=y[T+1];for(let L=0;L<d;L++){let D=(L+1)%d;M(C[L],C[D],I[D]),M(C[L],I[D],I[L])}}return E}function Ie(h,f,d=10){return ue(h.map(g=>new w(g[0],g[1],g[2])),f,d,!0)}function ze(h,f=24,d=0,g=0){let x=h.map(([y,E])=>{let M=[];for(let T=0;T<f;T++){let C=(T+.5)/f*Math.PI*2;M.push([d+Math.cos(C)*y,E,g+Math.sin(C)*y])}return M}),S=[],A=(y,E,M)=>S.push(y[0],y[1],y[2],E[0],E[1],E[2],M[0],M[1],M[2]);for(let y=0;y<x.length-1;y++){let E=x[y],M=x[y+1];for(let T=0;T<f;T++){let C=(T+1)%f;A(E[T],E[C],M[C]),A(E[T],M[C],M[T])}}let b=(y,E,M)=>{let T=[d,E,g];for(let C=0;C<f;C++){let I=(C+1)%f;M?A(T,y[I],y[C]):A(T,y[C],y[I])}};return h[0][0]>0&&b(x[0],h[0][1],!1),h[h.length-1][0]>0&&b(x[x.length-1],h[h.length-1][1],!0),S}function ot(h,f,d,g,x,S,A=.002){let b=new Jn(h,f,d,1,1,1).translate(g,x,S),y=h/2,E=d/2,M=[[y,E-A],[y-A,E],[-y+A,E],[-y,E-A],[-y,-E+A],[-y+A,-E],[y-A,-E],[y,-E+A]],T=[],C=(H,Z,O)=>T.push(H[0],H[1],H[2],Z[0],Z[1],Z[2],O[0],O[1],O[2]),I=x-f/2,L=x+f/2,D=M.length;for(let H=0;H<D;H++){let Z=(H+1)%D,O=[g+M[H][0],I,S+M[H][1]],W=[g+M[Z][0],I,S+M[Z][1]],G=[g+M[Z][0],L,S+M[Z][1]],J=[g+M[H][0],L,S+M[H][1]];C(O,W,G),C(O,G,J),C([g,L,S],J,G),C([g,I,S],W,O)}b.dispose();let z=new Oe;return z.setAttribute("position",new pe(T,3)),z}function rt(h,f,d,g){let x=[];for(let S=0;S<=g;S++){let A=f+(d-f)*S/g;x.push([h*Math.cos(A),h*Math.sin(A)])}return x}function _t(h){let f=new Oe;return f.setAttribute("position",new pe(h,3)),f}function xt(h){let f=(Math.imul(h|0,2654435761)^2654435769)>>>0||1;return()=>(f^=f<<13,f>>>=0,f^=f>>>17,f^=f<<5,f>>>=0,f/4294967296)}let q=[.84,.92,1,1.07,1.14],nt=(h,f)=>{let d=2*h()-1,g=2*Math.PI*h(),x=Math.sqrt(Math.max(0,1-d*d));return f.set(x*Math.cos(g),d,x*Math.sin(g))},mt=(h,f)=>{let d=nt(f,new w);return d.addScaledVector(h,-d.dot(h)),d.lengthSq()<1e-6&&d.set(0,1,0).addScaledVector(h,-h.y),d.normalize()};class Tt{constructor(){this.P=q.map(()=>[]),this.U=q.map(()=>[])}add(f,d,g,x,S,A,b=!1,y=0){let E=new w().crossVectors(g,d);E.lengthSq()<1e-8&&E.set(1,0,0).cross(d),E.normalize();let M=new w().crossVectors(d,E).normalize(),T=this.P[A],C=this.U[A],I=b?1:0,L=b?0:1,D=(H,Z,O,W,G)=>{let J=(dt,pt)=>T.push(f.x+E.x*dt*x+H.x*pt*S,f.y+E.y*dt*x+H.y*pt*S,f.z+E.z*dt*x+H.z*pt*S);J(-1,W),J(1,W),J(1,G),J(-1,W),J(1,G),J(-1,G),C.push(I,Z,L,Z,L,O,I,Z,L,O,I,O)};if(!(y>0)){D(M,0,1,-1,1);return}let z=y*Math.PI/360;D(M.clone().applyAxisAngle(E,z),0,.5,-1,0),D(M.clone().applyAxisAngle(E,-z),.5,1,0,1)}parts(f){let d=[];return q.forEach((g,x)=>{if(!this.P[x].length)return;let S=_t(this.P[x]);S.setAttribute("uv",new pe(this.U[x],2)),d.push({g:S,zone:f,uv:"own",tone:g})}),d}}function Dt(h,f,d,g,x=.76,S=.12){let A=new $n(1,2),b=A.attributes.position,y=new w;for(let E=0;E<b.count;E++){y.fromBufferAttribute(b,E);let M=x*(1+S*(u(y.x*1.7+9,y.y*1.7+9,y.z*1.7+9,d,2)*2-1));b.setXYZ(E,h.x+y.x*f.x*M,h.y+y.y*f.y*M,h.z+y.z*f.z*M)}return A.deleteAttribute("normal"),A.deleteAttribute("uv"),{g:A,zone:g,tone:.3}}function Ft({lobes:h=[],zone:f="leaf",core:d="leafCore",card:g=.4,density:x=1,seed:S=1,spread:A=.5,inner:b=.5,fold:y=0,facing:E="shell"}={}){let M=xt(S*7919+1),T=new Tt,C=[],I=h.map(W=>({C:new w().fromArray(W.c),r:Array.isArray(W.r)?new w().fromArray(W.r):new w(W.r,W.r,W.r)})),L=new w,D=new w,z=new w,H=new w,Z=new w,O=(W,G)=>I.some((J,dt)=>dt!==G&&Math.hypot((W.x-J.C.x)/J.r.x,(W.y-J.C.y)/J.r.y,(W.z-J.C.z)/J.r.z)<.82);return I.forEach(({C:W,r:G},J)=>{let pt=4*Math.PI*Math.pow((Math.pow(G.x*G.y,1.6)+Math.pow(G.x*G.z,1.6)+Math.pow(G.y*G.z,1.6))/3,.625),Pt=Math.max(12,Math.round(x*3.8*(E==="radial"?1.7:1)*pt/(g*g))),kt=Math.round(Pt*(1+b));for(let Zt=0;Zt<kt;Zt++){let Rt=Zt<Pt;nt(M,L);let Nt=Rt?.8+.14*M():.55+.25*M();if(z.set(W.x+L.x*G.x*Nt,W.y+L.y*G.y*Nt,W.z+L.z*G.z*Nt),O(z,J))continue;let lt=g*.5*(.8+.4*M()),ut=lt*(.85+.3*M()),Ut=Math.floor(M()*q.length);if(D.set(L.x/G.x,L.y/G.y,L.z/G.z).normalize(),E==="radial"&&Rt){let Xt=D.clone();mt(Xt,M).normalize();let Ot=mt(Xt,M);Z.crossVectors(Ot,Xt),z.addScaledVector(Xt,-lt*.25),T.add(z.clone(),Ot,Z.clone(),lt,ut,Ut,M()<.5,y)}else Rt?D.lerp(nt(M,H),A).normalize():nt(M,D),T.add(z.clone(),D.clone(),mt(D,M),lt,ut,Ut,M()<.5,y)}d&&d!=="none"&&C.push(Dt(W,G,S+J*13,d))}),C.concat(T.parts(f))}function Ht({base:h=[0,0,0],rims:f=null,bottom:d=.6,top:g=6,radius:x=1.4,tiers:S=5,taper:A=.08,zone:b="leaf",core:y="leafCore",card:E=.5,density:M=1,seed:T=1,droop:C=25,whorl:I=.35,branches:L=9,trunk:D=.05,step:z=.3,lip:H=0,segs:Z=12}={}){let O=xt(T*104729+3),W=new Tt,G=[],J;if(Array.isArray(f)&&f.length)J=f.map(Ct=>({y:+Ct.y,r:+Ct.r})).sort((Ct,Vt)=>Ct.y-Vt.y);else{let Ct=Math.max(.1,g-d),Vt=Ct/(S+.6);J=[];for(let ve=0;ve<S;ve++){let Gt=d+ve*Vt;J.push({y:Gt,r:x*(1-(Gt-d)/Ct*(1-A))})}}let dt=Math.max(g,J[J.length-1].y+.3),pt=J[0].y,Pt=dt-pt,kt=Ct=>{if(Ct<=J[0].y)return J[0].r;for(let Vt=0;Vt<J.length;Vt++){let ve=Vt+1<J.length?J[Vt+1].y:dt;if(Ct<=ve){let Gt=(Ct-J[Vt].y)/Math.max(1e-6,ve-J[Vt].y);return Vt+1<J.length?J[Vt].r*(1-z*Gt):J[Vt].r*Math.max(.05,1-(1-A)*Gt)}}return .05*J[J.length-1].r},Zt=Ct=>Math.max(.012,D*(1-.8*(Ct-pt)/Pt)),Rt=new w,Nt=new w,lt=new w,ut=new w,Ut=new w,Xt=new w,Ot=new w,fe=(Ct,Vt,ve,Gt)=>{let oe=new w().subVectors(Vt,Ct);if(oe.length()<1e-4)return;oe.normalize();let Le=new w(-oe.z,0,oe.x).normalize(),Me=new w().crossVectors(oe,Le).normalize(),pn=(F,$)=>[30,150,270].map(ft=>{let X=ft*Math.PI/180;return[F.x+(Le.x*Math.cos(X)+Me.x*Math.sin(X))*$,F.y+(Le.y*Math.cos(X)+Me.y*Math.sin(X))*$,F.z+(Le.z*Math.cos(X)+Me.z*Math.sin(X))*$]}),Ve=pn(Ct,ve),R=pn(Vt,Gt);for(let F=0;F<3;F++){let $=(F+1)%3;G.push(...Ve[F],...R[F],...R[$],...Ve[F],...R[$],...Ve[$])}},se=[];for(let Ct=pt,Vt=0;Ct<dt-.06*Pt;Vt++)se.push(Ct),Ct+=I*(.85+.3*O());let Pe=se.length;se.forEach((Ct,Vt)=>{let ve=kt(Ct),Gt=Zt(Ct),oe=(Ct-pt)/Pt,Ee=Math.max(3,Math.round(L*M*(.45+.55*(1-oe)))),Le=oe>.85,Me=E*(1-.45*oe),pn=C*(1-.4*oe),Ve=O()*Math.PI*2;for(let R=0;R<Ee;R++){if(O()<.08)continue;let F=Ve+(R+.5)/Ee*Math.PI*2+(O()-.5)*.5*Math.PI*2/Ee,$=Math.max(.5*Me,(ve*(1+H)-Gt)*(.85+.3*O())),ft=((Le?-15:pn)+16*(O()-.5))*Math.PI/180,X=ft-(22+12*O())*Math.PI/180;Xt.set(-Math.sin(F),0,Math.cos(F));let at=new w(h[0]+Math.cos(F)*Gt*.6,Ct,h[2]+Math.sin(F)*Gt*.6),vt=at.clone().add(new w(Math.cos(F)*Math.cos(ft),-Math.sin(ft),Math.sin(F)*Math.cos(ft)).multiplyScalar(.55*$)),ct=vt.clone().add(new w(Math.cos(F)*Math.cos(X),-Math.sin(X),Math.sin(F)*Math.cos(X)).multiplyScalar(.45*$)),ht=.014+.044*Math.pow(1-oe,1.3)*Math.min(1,$/1.5);fe(at,vt,ht,.55*ht),fe(vt,ct,.55*ht,.12*ht);let At=Math.max(2,Math.round(M*$/(.5*E))),Jt=Math.floor(O()*q.length),ne=new w(0,1,0),re=new w,de=new w,tn=(Ge,le,De,en,nn,Ji,$i=De*.75)=>{de.set(-le.z,0,le.x).normalize(),Nt.copy(Ge).addScaledVector(le,$i),lt.crossVectors(le,de).normalize().applyAxisAngle(le,1.8*(O()-.5)),W.add(Nt.clone(),lt.clone(),Ut.crossVectors(lt,le).clone(),De,en,nn,O()<.5),Ji&&(ut.copy(de).applyAxisAngle(le,.6*(O()-.5)),W.add(Nt.clone(),ut.clone(),Ut.crossVectors(ut,le).clone(),De,en*.9,nn,O()<.5))};(R%2===0||oe>.6)&&(re.copy(new w(Math.cos(F),1.4,Math.sin(F))).normalize(),tn(at,re,Me*.4,Me*.4,Jt,!0));let He=.08*$;for(let Ge=0;He<$&&Ge<12;Ge++){let le=He/$,De=le>.55,en=De?vt:at,nn=De?ct:vt,Ji=De?(le-.55)/.45:le/.55;Ot.lerpVectors(en,nn,Math.min(1,Ji)),Rt.subVectors(nn,en).normalize();let $i=(8+10*O())*Math.PI/180;Rt.applyAxisAngle(Xt,-$i*Math.sign(Xt.x*Rt.z-Xt.z*Rt.x||1)).normalize();let js=1.15-.7*Math.min(1,le),mn=Me*.5*(.85+.35*O())*js,Ki=He+1.9*mn>=$;Ki&&(mn=Math.max(.3*Me*.5,Math.min(mn,($-He)/1.4)));let tr=Me*.5*js*(Ki?.7:1);if(tn(Ot,Rt,mn,tr,(Jt+Ge)%q.length,!0,mn*.7),le>.45&&!Ki)for(let qr of[1,-1])re.copy(Rt).applyAxisAngle(ne,qr*(.5+.25*O())).normalize(),re.y-=.18+.1*O(),re.normalize(),tn(Ot,re,mn*.8,tr*.85,(Jt+Ge+2)%q.length,!1);He+=1.5*mn}}});let je=dt-.3*E,ti=.35*E,Zi=.35*E;for(let Ct=0;Ct<3;Ct++){let Vt=Ct*Math.PI/3;W.add(new w(h[0],je,h[2]),new w(Math.cos(Vt),0,Math.sin(Vt)),new w(-Math.sin(Vt),0,Math.cos(Vt)),ti,Zi,Math.floor(O()*q.length),!1)}let ei=W.parts(b);return G.length&&ei.push({g:_t(G),zone:y,tone:.32}),ei}return{HD_ENV:m,KINDS:t,MATERIAL_FIELDS:e,HD_BUDGET:n,hdTriBudget:i,noise3:c,fbm3:u,finishShapesPattern:U,mapsFor:B,materialFor:K,animate:st,fireBounds:it,boxUV:St,boxUVInto:Mt,smoothByAngle:Lt,wrinkle:et,assemble:$t,keepSeeThrough:zt,dress:Yt,guessMaterials:ge,dressByAlbedo:_e,sweepTubePositions:ue,weltPositions:Ie,lathePositions:ze,chamferedBox:ot,arc:rt,posGeo:_t,canopy:Ft,conifer:Ht}})(),Hr=(()=>{let{assemble:m,posGeo:t,noise3:e,KINDS:n}=vc,i="hd",s=Math.PI*2,r={"sand-fig":{leaf:"#3F6440",leafUnder:"#7E9179",stem:"#6B4A32",pot:"#D2B084",soil:"#4E3423"},"pale-ceramic":{leaf:"#5B8551",leafUnder:"#7E9179",stem:"#8A6244",pot:"#F3EEE8",soil:"#4E3423"},terracotta:{leaf:"#3F6440",leafUnder:"#5B8551",stem:"#6B4A32",pot:"#C4623F",soil:"#4E3423"},"slate-planter":{leaf:"#3F6440",leafUnder:"#7E9179",stem:"#4E3423",pot:"#47423C",soil:"#2E2A26"}},o=r,a=r["sand-fig"],l=["leaf","leafUnder","stem","pot","soil"],c={leaf:{kind:"foliage",finish:"leaf",crease:50,describe:"upper surface of a leathery ficus leaf: waxy, folded at the midrib, the side veins leaving the pale midrib at 45 degrees toward the tip, mirrored on the two halves as chevrons"},leafUnder:{kind:"foliage",finish:"leaf",crease:50,describe:"the paler, duller underside of the same leaf, keeled along the midrib, veins along the blade; also the pale midrib strip on the upper face"},stem:{kind:"wood",finish:"bark",crease:75,describe:"young woody ficus trunk, limbs and petioles: thin bark, furrows running along each member"},pot:{kind:"ceramic",finish:"matte",crease:10,describe:"faceted matte moulded ceramic planter: flat facets meeting at narrow bevelled arrises, a hard belly crease, a rolled lip and a chamfered foot"},soil:{kind:"soil",finish:"dry",describe:"dry potting compost, lumpy and gritty, mounded slightly toward the stem"}},u={colorway:{type:"choice",default:"slate-planter",label:"Colorway",options:["sand-fig","pale-ceramic","terracotta","slate-planter"],describe:"Curated kit-coherent scheme. sand-fig is the shipped default: deep sage foliage over a warm sand ceramic planter. pale-ceramic lightens the pot to off-white plaster and the foliage to a fresher mid green, for a bright room. terracotta swaps the planter to the kit accent clay and keeps the dark foliage, so the plant is the room's one warm note. slate-planter is a charcoal pot with near-black soil and deep foliage, for a dark scheme."},species:{type:"choice",default:"fig",affects:"geometry",label:"Species",options:["fig","palm","bushy"],describe:"Which plant is in the pot. fig (default) is the broad-leaf ficus of the reference: a bare woody stem with a forked pair of side limbs, carrying whorls of three wide ovate leaves on short petioles. palm replaces it with a bare thick cane and long narrow strappy fronds that arch up and droop at the tip \u2014 taller and far more open, no side limbs. bushy is a compact multi-stem shrub: a short stubby trunk, low limbs and dense whorls of small rounded leaves starting just above the soil, about 30% shorter and noticeably wider. All three stand in the same planter on the same 0.5 m footprint."},tiers:{type:"range",default:5,min:3,max:6,step:1,affects:"geometry",label:"Leaf tiers",describe:"REBUILDS the plant by adding whorls of leaves up the stem at a CONSTANT pitch (0.148 m on the fig) rather than stretching it \u2014 the stem grows by exactly one pitch, the new whorl brings its own blades, and the triangle count steps with every value. 3 is a young 1.17 m plant with a long bare stem under a small crown; 5 (default) is the 1.44 m specimen shown; 6 reaches 1.59 m, the ceiling this kit sets for a floor plant. Leaf size, blade shape, trunk section and pot are identical at every value \u2014 only how many whorls there are."},fullness:{type:"range",default:3,min:2,max:4,step:1,affects:"geometry",label:"Fullness",describe:"How many leaves stand in each whorl (the palm and bushy species carry one more per whorl than this number). 2 is a sparse, leggy plant with the stem clearly visible straight through the crown; 3 is the default; 4 is a thick, well-watered crown with the blades overlapping. Whorl spacing and blade size never change, only how crowded each ring is \u2014 so the silhouette fills out without the plant growing."},potSize:{type:"range",default:.38,min:.3,max:.46,step:.02,affects:"geometry",label:"Pot size",describe:"Outside diameter of the planter in metres, and the pot is REBUILT at each value, not scaled: its facet count steps 8 / 10 / 12 as it grows so the ceramic holds roughly the same facet width in world units, and the triangle count moves with it. 0.30 is a slim pot for a tight corner; 0.38 is the default; 0.46 is a heavy statement planter that still clears the 0.5 m half-module footprint. Pot height tracks the diameter one for one, so the whole plant rides up or down about 80 mm across the range."},lived_in:{type:"range",default:0,min:0,max:1,step:.05,affects:"geometry",label:"Lived in",describe:"The kit-wide showroom-to-lived-in axis, and all of it is GEOMETRY. At 0 the plant is nursery-fresh: the stem stands dead plumb, every leaf is pitched up and crisp, and the soil is filled to 75 mm below the rim. At the 0.35 default the stem has taken a slight lean toward the light, the leaves have relaxed about 8 degrees and the soil has settled a little. At 1.0 it has been in the room for years: the stem's upper run leans about 8 degrees, every blade has drooped roughly 22 degrees and arches harder at the tip, the soil has settled 35 mm further down the pot, and the plant has gone LEGGY \u2014 the lowest whorl has been shed entirely, so a long bare length of stem shows below the crown and the triangle count drops. Bilaterally symmetric at every value; the lean runs front-to-back so the mirror plane is untouched."},leaf:{type:"color",default:a.leaf,label:"Leaf",describe:"Albedo of every leaf's UPPER surface, the plant's dominant mass. Wants to stay a deep foliage green \u2014 this zone is roughly half the object's triangles and carries the whole read at distance."},leafUnder:{type:"color",default:a.leafUnder,label:"Leaf underside",describe:"Albedo of every leaf's underside. Real foliage is paler beneath, and this is what gives the crown its two green tones from any angle; keep it a clear step LIGHTER than `leaf` or the crown flattens to one mass."},stem:{type:"color",default:a.stem,label:"Stem",describe:"Albedo of the woody trunk, its side limbs and every leaf's petiole. A mid-to-dark brown: it must read as a dark vertical against both the pale pot below it and the foliage around it."},pot:{type:"color",default:a.pot,label:"Pot",describe:"Albedo of the whole matte ceramic planter \u2014 outside wall, rim ledge, inner wall and base. The lightest zone on the asset and the one that sets the piece against the floor."},soil:{type:"color",default:a.soil,label:"Soil",describe:"Albedo of the mounded earth surface recessed in the pot mouth. The darkest zone; it exists to make the mouth read as a real recess rather than a filled disc."}},p={},_=[],v={},P=[],N=12,k=8,U=5,V=35,B=24,K=8,tt=15,j=.06,Y=.12,st=.7,it=50*Math.PI/180,gt=n.foliage.finishes.leaf.tile??n.foliage.tile,St=ot=>[0,-ot*.6,-.012],Mt=.4,Lt=[65*Math.PI/180,-115*Math.PI/180];function et(ot,rt,_t,xt){let q=_t[0]-rt[0],nt=_t[1]-rt[1],mt=_t[2]-rt[2],Tt=xt[0]-rt[0],Dt=xt[1]-rt[1],Ft=xt[2]-rt[2],Ht=nt*Ft-mt*Dt,h=mt*Tt-q*Ft,f=q*Dt-nt*Tt;Ht*Ht+h*h+f*f<1e-16||ot.push(rt[0],rt[1],rt[2],_t[0],_t[1],_t[2],xt[0],xt[1],xt[2])}function Bt(ot){let rt=Math.imul(ot^2654435769,2246822519);return rt=Math.imul(rt^rt>>>13,3266489917),rt^=rt>>>16,(rt>>>0)/4294967295}let It=(ot,rt,_t)=>Math.min(_t,Math.max(rt,ot));function $t(ot,rt,_t){let xt=ot.attributes.position,q=new Float32Array(xt.count*2);for(let nt=0;nt<xt.count;nt++){let mt=xt.getX(nt),Tt=xt.getZ(nt);q[nt*2]=(mt*rt[0]+Tt*rt[1])/gt,q[nt*2+1]=(mt*_t[0]+Tt*_t[1])/gt}return ot.setAttribute("uv",new ee(q,2)),ot}let zt=(ot,rt,_t)=>{let xt=It((_t-ot)/(rt-ot),0,1);return xt*xt*(3-2*xt)};function Yt(ot,rt,_t=[]){let xt=(q,nt)=>{let mt=nt/rt*s;return[Math.sin(mt)*q.r+(q.x||0),q.y,Math.cos(mt)*q.r+(q.z||0)]};for(let q=0;q<ot.length-1;q++){let nt=ot[q],mt=ot[q+1];for(let Tt=0;Tt<rt;Tt++){let Dt=(Tt+1)%rt;et(_t,xt(nt,Tt),xt(nt,Dt),xt(mt,Dt)),et(_t,xt(nt,Tt),xt(mt,Dt),xt(mt,Tt))}}return _t}function Qt(ot,rt,_t,xt=null,q=[]){let nt=Tt=>{let Dt=Tt/rt*s;return[Math.sin(Dt)*ot.r+(ot.x||0),ot.y,Math.cos(Dt)*ot.r+(ot.z||0)]},mt=[ot.x||0,xt??ot.y,ot.z||0];for(let Tt=0;Tt<rt;Tt++){let Dt=nt(Tt),Ft=nt((Tt+1)%rt);_t?et(q,mt,Dt,Ft):et(q,mt,Ft,Dt)}return q}function ge(ot,rt,_t,xt=null){let q=[],nt=[],mt=new w(0,0,1),Tt=new w(1,0,0),Dt=null;for(let Ft=0;Ft<ot.length;Ft++){let Ht=new w().subVectors(ot[Math.min(Ft+1,ot.length-1)],ot[Math.max(Ft-1,0)]).normalize(),h;Dt?h=Dt.clone().sub(Ht.clone().multiplyScalar(Dt.dot(Ht))).normalize():h=new w().crossVectors(Ht,Math.abs(Ht.z)>.9?Tt:mt).normalize(),Dt=h;let f=new w().crossVectors(Ht,h),d=[];for(let g=0;g<_t;g++){let x=g/_t*s;d.push(ot[Ft].clone().addScaledVector(h,Math.cos(x)*rt[Ft]).addScaledVector(f,Math.sin(x)*rt[Ft]).toArray())}nt.push(d)}for(let Ft=0;Ft<nt.length-1;Ft++){let Ht=nt[Ft],h=nt[Ft+1];for(let f=0;f<_t;f++){let d=(f+1)%_t;et(q,Ht[f],Ht[d],h[d]),et(q,Ht[f],h[d],h[f])}}if(xt){let Ft=nt[nt.length-1],Ht=xt.toArray();for(let h=0;h<_t;h++)et(q,Ft[h],Ft[(h+1)%_t],Ht)}return q}function Ce([ot,rt,_t],xt){let q=mt=>mt<=0||mt>=1?0:Math.pow(mt,ot)*Math.pow(1-Math.pow(mt,rt),_t),nt=0;for(let mt=1;mt<400;mt++)nt=Math.max(nt,q(mt/400));return mt=>xt*q(mt)/nt}function Be(ot){let rt=[];for(let _t=0;_t<ot;_t++){let xt=_t/(ot-1);rt.push(j+(1-j)*(xt-.35*Math.sin(s*xt)/s))}return rt}function ke({len:ot,width:rt,rise:_t,drop:xt,cup:q,stalk:nt,n:mt}){let Tt=C=>[0,(_t*C-xt*C*C+Y*Math.sin(Math.PI*Math.pow(C,.75)))*ot,C*ot],Dt=q*st,Ht=Be(mt).map(C=>{let I=(C-j)/(1-j),L=rt(I)*ot,D=Tt(C),z=Math.min(.0024*(1-.6*I),.12*L),H=O=>[O,D[1]-Dt*L*(O/Math.max(L,1e-6))**2,D[2]],Z=(L+z)/2;return{L:H(-L),Lm:H(-Z),rl:H(-z),rr:H(z),Rm:H(Z),R:H(L),K:[0,D[1]-Math.min(.0015,.25*L),D[2]]}}),h=[],f=[],d=[],g=[],x=[];for(let C=0;C<Ht.length-1;C++){let I=Ht[C],L=Ht[C+1];et(h,I.L,L.L,L.Lm),et(h,I.L,L.Lm,I.Lm),et(h,I.Lm,L.Lm,L.rl),et(h,I.Lm,L.rl,I.rl),et(f,I.rr,L.rr,L.Rm),et(f,I.rr,L.Rm,I.Rm),et(f,I.Rm,L.Rm,L.R),et(f,I.Rm,L.R,I.R),et(d,I.L,L.K,L.L),et(d,I.L,I.K,L.K),et(g,I.K,L.R,L.K),et(g,I.K,I.R,L.R),et(x,I.rl,L.rl,L.rr),et(x,I.rl,L.rr,I.rr)}let S=C=>new w(...C),A=j,b=[S(St(nt)),S(Tt(A)).add(new w(0,-nt*.7,0))],y=ge(b,[nt,nt*.8],U,S(Tt(A+.07)).add(new w(0,-nt*.5,0))),E=S(Tt(1)).sub(S(Tt(0))),M=Math.cos(it),T=Math.sin(it);return{topL:$t(t(h),[-T,M],[M,T]),topR:$t(t(f),[T,M],[M,-T]),underL:$t(t(d),[-T,M],[M,T]),underR:$t(t(g),[T,M],[M,-T]),rib:$t(t(x),[0,1],[1,0]),pet:t(y),dir:E}}let dn={fig:{clear:.215,pitch:.148,headroom:.13,r0:.03,r1:.011,extra:0,T:[0,.12,.45,.86,1],W:[0,.07,.3,.25,0],len:.4,leafPitch:.62,rise:.3,drop:.44,cup:.25,crown:2,crownLen:.26,crownPitch:1,limbs:{at:2,len:.215,tilt:.62,r0:.02,r1:.012,leaf:.28,leafPitch:.52},stalk:.004,shape:[.65,1.8,1.25]},palm:{clear:.33,pitch:.125,headroom:.07,r0:.046,r1:.024,extra:1,T:[0,.1,.82,1],W:[0,.095,.118,0],len:.44,leafPitch:.92,rise:.58,drop:.78,cup:.35,crown:3,crownLen:.34,crownPitch:1,limbs:null,stalk:.0065,shape:[.3,4,1.15]},bushy:{clear:.14,pitch:.125,headroom:.05,r0:.033,r1:.016,extra:1,T:[0,.18,.62,1],W:[0,.24,.225,0],len:.3,leafPitch:.44,rise:.34,drop:.52,cup:.42,crown:3,crownLen:.215,crownPitch:.85,limbs:{at:0,len:.19,tilt:1.02,r0:.017,r1:.011,leaf:.23,leafPitch:.34},stalk:.0035,shape:[.5,1.6,1.1]}},_e=[.64,.825,1,.88,.79,.75,.7],ue=[0,.172,.417,1,1,.889,.639];function Ie(ot,rt){let _t=[];for(let nt=0;nt<ot;nt++){let mt=rt+nt/ot*s;_t.push(((mt+Math.PI)%s+s)%s-Math.PI)}let xt=_t.map(nt=>Math.round(Math.abs(nt)*1e5)),q=[...new Set(xt)].sort((nt,mt)=>nt-mt);return{az:_t,pair:xt.map(nt=>q.indexOf(nt))}}function ze(ot={}){let rt={colorway:u.colorway.default,species:u.species.default,tiers:u.tiers.default,fullness:u.fullness.default,potSize:u.potSize.default,lived_in:u.lived_in.default,...ot},xt={...r[rt.colorway]||a};for(let R of l)ot[R]!==void 0&&(xt[R]=ot[R]);let q=dn[rt.species]||dn.fig,nt=It(Math.round(rt.tiers),3,6),mt=It(Math.round(rt.fullness),2,4)+q.extra,Tt=It(rt.potSize,.3,.46),Dt=It(rt.lived_in,0,1),Ft=[],Ht=(R,F,$=null,ft=1,X=0)=>Ft.push({g:R,zone:F,grain:$,tone:ft,shift:X}),h=(R,F,$,ft)=>{let X=R.attributes.uv;for(let at=0;at<X.count;at++)X.setXY(at,X.getX(at)+ft,X.getY(at)+ft*.37);Ft.push({g:R,zone:F,tone:$,shift:ft,uv:"own"})},f=Tt/2,d=Tt*1,g=Tt<.35?8:Tt<.43?10:12,x=.006,S=.004,A=.005,b=_e[3]*f,y=_e[4]*f,E=R=>_e[2]*f+(b-_e[2]*f)*(R-ue[2]*d)/((1-ue[2])*d),M=(_e[4]-_e[5])*f/((ue[4]-ue[5])*d),T=.7*d,C=y-M*(d-T),I=Math.SQRT1_2,L=[[_e[0]*f,0],[_e[1]*f,ue[1]*d],[_e[2]*f,ue[2]*d],[E(d-x),d-x],[b-x+x*I,d-x+x*I],[b-x,d],[y+S,d],[y,d-S],[C,T]],D=([R,F])=>{let $=[];for(let X=0;X<g;X++){let at=X/g*s;$.push([Math.sin(at)*R,Math.cos(at)*R])}let ft=[];for(let X=0;X<g;X++){let at=$[X],vt=$[(X-1+g)%g],ct=$[(X+1)%g],ht=(At,Jt)=>{let ne=Math.hypot(At[0]-at[0],At[1]-at[1]);return[at[0]+(At[0]-at[0])*Jt/ne,F,at[1]+(At[1]-at[1])*Jt/ne]};ft.push(ht(vt,A),ht(ct,A))}return ft};{let R=L.map(D),F=R[0].length,$=[];for(let X=0;X<R.length-1;X++){let at=R[X],vt=R[X+1];for(let ct=0;ct<F;ct++){let ht=(ct+1)%F;et($,at[ct],at[ht],vt[ht]),et($,at[ct],vt[ht],vt[ct])}}let ft=R[0];for(let X=1;X<F-1;X++)et($,ft[0],ft[X+1],ft[X]);Ht(t($),"pot")}let z=d-f*(.375+.175*Dt),H=R=>{let F=It((R-T)/(d-S-T),0,1);return C+(y-C)*F};{let R=g*2,F=H(z)+.006,$=.016,ft=(vt,ct,ht)=>{let At=[];for(let Jt=0;Jt<R;Jt++){let ne=Jt/R*s,re=Jt%2===0||vt<F?vt:vt*Math.cos(Math.PI/g),de=Math.sin(ne)*re,tn=Math.cos(ne)*re,He=ht?(e(Math.abs(de)*45,3.1,tn*45,7)-.5)*2*ht:0;At.push([de,z+ct+He,tn])}return At},X=[ft(F,0,0),ft(F*.55,$*.6,.004),ft(q.r0*.75,$*.9,0)],at=[];for(let vt=0;vt<X.length-1;vt++)for(let ct=0;ct<R;ct++){let ht=(ct+1)%R;et(at,X[vt][ct],X[vt][ht],X[vt+1][ht]),et(at,X[vt][ct],X[vt+1][ht],X[vt+1][ct])}Ht(t(at),"soil")}let Z=z-.045,O=[];for(let R=0;R<nt;R++)O.push(z+q.clear+R*q.pitch);let W=O[nt-1]+q.headroom,G=.012+.085*Dt,J=R=>{let F=It((R-Z)/Math.max(.05,W-Z),0,1),$=Math.max(0,(F-.35)/.65);return G*$*$},dt=R=>{let F=It((R-Z)/Math.max(.05,W-Z),0,1);return q.r0+(q.r1-q.r0)*Math.pow(F,.8)},pt=Dt>=.55&&nt>=3?1:0;{let R=[z,z+.018,z+.05],F=W-.028,$=F-R[2],ft=Math.max(2,Math.ceil($/.3));for(let ct=1;ct<=ft;ct++)R.push(R[2]+$*ct/ft);let X=ct=>1+.3*Math.exp(-Math.max(0,ct-z)/.028),at=R.map(ct=>({y:ct,r:dt(ct)*X(ct),z:J(ct)})),vt=Yt(at,N);Qt(at[0],N,!1,null,vt),Qt(at[at.length-1],N,!0,W,vt),Ht(t(vt),"stem","y",1,.13)}let Pt=.45*Dt,kt=1+.45*Dt,Zt=Ce(q.shape,Math.max(...q.W)),Rt=(nt-pt)*mt+q.crown+(q.limbs?2:0),Nt=Math.min(1,Math.sqrt(B/Rt)),lt=137.5*Math.PI/180,ut=Math.PI/2,Ut=20*Math.PI/180,Xt=ut-2*Ut,Ot=R=>{let F=Math.floor(R/ut),$=R-F*ut;return F*ut+Ut+$*Xt/ut},fe=R=>{let F=Math.floor(R/ut),$=It(R-F*ut,Ut,ut-Ut);return F*ut+($-Ut)*ut/Xt},se=R=>Mt+R*lt+(Bt(431+R*17)-.5)*.12,Pe=(R,F,$,ft,X,at,vt,ct=null,ht=[0,0,0],At=1)=>{let Jt=ct===null?1:.86+.28*ct,ne=ct===null?1:1.18-.36*ct;return{len:R*(.93+X*.15),n:It(Math.round(R*V*Nt),K,tt),drop:q.drop*kt*(.88+X*.26)*ne*At,pitch:Math.min(1.4,F*(1-Pt)*(.55+X*.75)*Jt)-.09*Dt,y:$+(X-.5)*.085*(ct===null?1:.2),r:ft,jitter:X,z0:vt,off:ht,raw:at,az:ct===null?at:Ot(at),scale:1,tilt:0,swing:0}},je=R=>{let F=R.swing?Ot(R.raw+R.swing):R.az,$=Math.abs(Math.sin(F))<1e-6?0:Math.sign(Math.sin(F)),ft=new ae().makeRotationY(F).multiply(new ae().makeRotationX(-(R.pitch-R.tilt))).multiply(new ae().makeRotationZ($*(R.jitter-.45)*.85));return R.base=R.anchor?R.anchor.clone().sub(new w(...St(q.stalk)).applyMatrix4(ft)):new w(Math.sin(F)*R.r+R.off[0],R.y+R.off[1],Math.cos(F)*R.r+R.z0+R.off[2]),R.M=new ae().makeTranslation(R.base.x,R.base.y,R.base.z).multiply(ft),R},ti=(R,F)=>ke({len:F,width:Zt,rise:q.rise,drop:R.drop,cup:q.cup,stalk:q.stalk,n:R.n}),Zi=new w,ei=R=>{let F=`${R.scale},${R.tilt},${R.swing}`;if(R.at===F)return R.box;if(!R.local){let $=ti(R,R.len);R.local=[$.topL,$.topR,$.underL,$.underR].flatMap(ft=>Array.from(ft.attributes.position.array)),R.box=new Re}je(R),R.box.makeEmpty();for(let $=0;$<R.local.length;$+=3)R.box.expandByPoint(Zi.set(R.local[$]*R.scale,R.local[$+1]*R.scale,R.local[$+2]*R.scale).applyMatrix4(R.M));return R.at=F,R.box},Ct=R=>{je(R);let F=ti(R,R.len*R.scale);for(let at of["topL","topR","underL","underR","rib","pet"])F[at].applyMatrix4(R.M);let $=F.dir.clone().transformDirection(R.M).toArray(),ft=.92+.13*R.jitter,X=R.jitter;h(F.topL,"leaf",ft,X),h(F.topR,"leaf",ft,X),h(F.underL,"leafUnder",ft,X),h(F.underR,"leafUnder",ft,X),h(F.rib,"leafUnder",1.08,X),Ht(F.pet,"stem",$,.95,X)},Vt=R=>{let F=nt>1?R/(nt-1):.45;return 1-.16*Math.pow(Math.abs(F-.45)*2,1.4)},ve=R=>It((R-O[0])/Math.max(.05,O[nt-1]-O[0]),0,1),Gt=q.limbs,oe=R=>{let F=O[Math.min(Gt.at,nt-1)]+q.pitch*.45,$=J(F),ft=dt(F)*.8,X=Gt.tilt+.16*Dt,at=Math.sin(X),vt=Math.cos(X),ct=[];for(let ht=0;ht<=3;ht++){let At=ht/3,Jt=At*Gt.len,ne=ft+Jt*at;ct.push(new w(Math.sin(R)*ne,F+Jt*vt+.055*At*At,Math.cos(R)*ne+$))}return ct},Ee=[],Le=[],Me=[],pn=[];for(let R=pt;R<nt;R++){let F=O[R],$=J(F),ft=dt(F)*.72,X=Ie(mt,R%2*(Math.PI/mt));for(let at=0;at<mt;at++){let vt=R*mt+at,ct=F+((at+.5)/mt-.5)*q.pitch*.75,ht=Vt(R)*(.88+.24*Bt(733+vt*11));Ee.push(Pe(q.len*ht,q.leafPitch,ct,dt(ct)*.72,Bt(211+vt*37),se(vt),J(ct),ve(ct),void 0,.8+.4*Bt(919+vt*13))),Le.push(Pe(q.len*Vt(R),q.leafPitch,F,ft,Bt(211+R*37+X.pair[at]*13),X.az[at],$))}}{let R=W-.035,F=J(R),$=dt(R)*.85,ft=Ie(q.crown,q.crown===2?Math.PI/2:0);for(let X=0;X<q.crown;X++){let at=nt*mt+X;Ee.push(Pe(q.crownLen,q.crownPitch,R+(X-(q.crown-1)/2)*.012,$,Bt(613+at*29),se(at),F,1)),Le.push(Pe(q.crownLen,q.crownPitch,R,$,Bt(613+ft.pair[X]*29),ft.az[X],F))}}if(Gt){for(let R of Ie(2,Math.PI/2).az){let F=oe(R)[3];pn.push(F),Le.push(Pe(Gt.leaf,Gt.leafPitch,F.y-.006,0,Bt(907+Math.round(Math.abs(R)*1e3)),R,0,null,[F.x,0,F.z]))}for(let R of Lt){let F=oe(R)[3];Me.push(F);let $=Pe(Gt.leaf,Gt.leafPitch,F.y,0,Bt(907+Math.round(Math.abs(R)*1e3)),fe(R),0,ve(F.y));$.anchor=F,Ee.push($)}}{let R=new Re,F=new w;for(let ht of Le)je(ht),q.T.forEach((At,Jt)=>{let ne=(q.rise*At-ht.drop*At*At)*ht.len,re=At*ht.len,de=q.W[Jt]*ht.len;R.expandByPoint(F.set(0,ne,re).applyMatrix4(ht.M)),R.expandByPoint(F.set(de,ne-q.cup*de,re).applyMatrix4(ht.M)),R.expandByPoint(F.set(-de,ne-q.cup*de,re).applyMatrix4(ht.M))});for(let ht of pn)R.expandByPoint(ht);let $=[["x","max"],["x","min"],["y","max"],["z","max"],["z","min"]],ft={};for(let ht of["x","y","z"])ft[ht]=Math.max(.02*(R.max[ht]-R.min[ht]),.015);let X=new Re,at=()=>{X.makeEmpty();for(let At of Ee)X.union(ei(At));for(let At of Me)X.expandByPoint(At);let ht=0;for(let[At,Jt]of $)ht+=((X[Jt][At]-R[Jt][At])/ft[At])**2;for(let At of Ee)ht+=.02*(((At.scale-1)/.25)**2+(At.tilt/.6)**2+(At.swing/.1)**2);return ht},vt=[["scale",.7,1.3,.06],["tilt",-.1,.8,.08],["swing",-.1,.1,.04]],ct=at();for(let ht=0;ht<4;ht++){let At=.5**ht;for(let Jt=0;Jt<8;Jt++){let ne=!1;for(let re of Ee)for(let[de,tn,He,Ge]of vt)for(let le of[Ge*At,-Ge*At]){let De=re[de],en=It(De+le,tn,He);if(en===De)continue;re[de]=en;let nn=at();if(nn<ct-1e-9){ct=nn,ne=!0;break}re[de]=De}if(!ne)break}}}for(let R of Ee)Ct(R);if(Gt){let R=q.stalk*1.3;for(let F of Lt){let $=oe(F),ft=[];for(let ct=0;ct<=3;ct++){let ht=ct/3;ft.push(ht<.6?Gt.r0+(Gt.r1-Gt.r0)*ht/.6:Gt.r1+(R-Gt.r1)*zt(.6,1,ht))}let X=$[3],at=X.clone().sub($[2]).normalize(),vt=ge($,ft,k,X.clone().addScaledVector(at,R*.4));Ht(t(vt),"stem",X.clone().sub($[0]).toArray(),.96,.4)}}let Ve=new Un;return Ve.name="floor-houseplant",Ve.add(m(Ft,{name:"houseplant",colors:xt,materials:c})),Ve}return{edition:i,presets:o,materials:c,params:u,rig:p,detach:_,night:v,decals:P,createAsset:ze,default:ze}})(),{createAsset:Gr,decals:Gm,detach:Wm,edition:Xm,materials:qm,night:Ym,params:Wr,presets:Zm,rig:Jm}=Hr,$m=Hr.default;var Sc=Gr,bc=Wr||{},Xr=Object.entries(bc).flatMap(([m,t])=>{if(!t||!["choice","range","integer","toggle","color"].includes(t.type))return[];let e={key:m,kind:t.type,label:t.label||m,hint:t.describe||""};if(t.type==="choice"){if(!Array.isArray(t.options)||!t.options.every(n=>typeof n=="string"))return[];e.options=t.options.map(n=>({value:n,label:n}))}if(t.type==="range"||t.type==="integer"){if(![t.min,t.max,t.step].every(Number.isFinite))return[];Object.assign(e,{min:t.min,max:t.max,step:t.step})}return[{...e,default:t.default}]}),wc={controls:Xr.map(({default:m,...t})=>t)};function Ec(m={}){let t=Object.fromEntries(Xr.map(n=>[n.key,m[n.key]??n.default])),e=Sc(m);return e.userData.design={applied:t},e}function Tc(m){m.traverse(t=>{t.geometry?.dispose(),Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material?.dispose()})}return Qr(Ac);})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
