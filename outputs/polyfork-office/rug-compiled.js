var PolyspoonRecipe=(()=>{var as=Object.defineProperty;var po=Object.getOwnPropertyDescriptor;var mo=Object.getOwnPropertyNames;var go=Object.prototype.hasOwnProperty;var _o=(o,t)=>{for(var e in t)as(o,e,{get:t[e],enumerable:!0})},xo=(o,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of mo(t))!go.call(o,i)&&i!==e&&as(o,i,{get:()=>t[i],enumerable:!(n=po(t,i))||n.enumerable});return o};var yo=o=>xo(as({},"__esModule",{value:!0}),o);var hh={};_o(hh,{createAsset:()=>lh,disposeAsset:()=>ch,metadata:()=>ah});var Dr=1;var Nr=3,Ks=0,Ur=1,Oe=2;var Fr=1;var Or=100;var Br=204,zr=205;var Cs=0,Is=1,Ps=2,Ti=3,Ls=4,Ds=5,Ns=6,Us=7,Qs=0,kr=1,Vr=2;var js=1,tr=2,er=3,nr=4,ir=5,sr=6,rr=7;var or=300,Hr=301,ar=302;var Gr=306,Gn=1e3,kn=1001,Fs=1002,Os=1003;var Ji=1006;var $i=1008;var Wr=1009;var Xr=1015;var Ki=1023;var Wn=2300,Ai=2301,Si=2302,Bs=2303,zs=2400,ks=2401,Vs=2402;var qr=0;var lr="",le="srgb",Hs="srgb-linear",Gs="linear",wi="srgb";var Ei=7680;var Yr=519;var Zr=35044;var Vn=2e3,Ws=2001;function vo(o){for(let t=o.length-1;t>=0;--t)if(o[t]>=65535)return!0;return!1}function Mo(o){return ArrayBuffer.isView(o)&&!(o instanceof DataView)}function Xs(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}var dr={},Ri=null;function Jr(o){let t=o[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=o[1];e&&e.isStackTrace?o[0]+=" "+e.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function Vt(...o){o=Jr(o);let t="THREE."+o.shift();if(Ri)Ri("warn",t,...o);else{let e=o[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...o)}}function Dt(...o){o=Jr(o);let t="THREE."+o.shift();if(Ri)Ri("error",t,...o);else{let e=o[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...o)}}function An(...o){let t=o.join(" ");t in dr||(dr[t]=!0,Vt(...o))}var bo={[Cs]:Is,[Ps]:Ns,[Ls]:Us,[Ti]:Ds,[Is]:Cs,[Ns]:Ps,[Us]:Ls,[Ds]:Ti},Ze=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let i=n[t];if(i!==void 0){let s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let i=n.slice(0);for(let s=0,r=i.length;s<r;s++)i[s].call(this,t);t.target=null}}},Qt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var fh=Math.PI/180,So=180/Math.PI;function si(){let o=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Qt[o&255]+Qt[o>>8&255]+Qt[o>>16&255]+Qt[o>>24&255]+"-"+Qt[t&255]+Qt[t>>8&255]+"-"+Qt[t>>16&15|64]+Qt[t>>24&255]+"-"+Qt[e&63|128]+Qt[e>>8&255]+"-"+Qt[e>>16&255]+Qt[e>>24&255]+Qt[n&255]+Qt[n>>8&255]+Qt[n>>16&255]+Qt[n>>24&255]).toLowerCase()}function pt(o,t,e){return Math.max(t,Math.min(e,o))}function wo(o,t){return(o%t+t)%t}function ls(o,t,e){return(1-e)*o+e*t}function Un(o,t){switch(t.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ae(o,t){switch(t.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var At=class o{static{o.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=pt(this.x,t.x,e.x),this.y=pt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=pt(this.x,t,e),this.y=pt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(pt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(pt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*n-r*i+t.x,this.y=s*i+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ue=class{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,r,l){let a=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=s[r+0],m=s[r+1],x=s[r+2],C=s[r+3];if(u!==C||a!==d||c!==m||h!==x){let O=a*d+c*m+h*x+u*C;O<0&&(d=-d,m=-m,x=-x,C=-C,O=-O);let V=1-l;if(O<.9995){let B=Math.acos(O),U=Math.sin(B);V=Math.sin(V*B)/U,l=Math.sin(l*B)/U,a=a*V+d*l,c=c*V+m*l,h=h*V+x*l,u=u*V+C*l}else{a=a*V+d*l,c=c*V+m*l,h=h*V+x*l,u=u*V+C*l;let B=1/Math.sqrt(a*a+c*c+h*h+u*u);a*=B,c*=B,h*=B,u*=B}}t[e]=a,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,s,r){let l=n[i],a=n[i+1],c=n[i+2],h=n[i+3],u=s[r],d=s[r+1],m=s[r+2],x=s[r+3];return t[e]=l*x+h*u+a*m-c*d,t[e+1]=a*x+h*d+c*u-l*m,t[e+2]=c*x+h*m+l*d-a*u,t[e+3]=h*x-l*u-a*d-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,i=t._y,s=t._z,r=t._order,l=Math.cos,a=Math.sin,c=l(n/2),h=l(i/2),u=l(s/2),d=a(n/2),m=a(i/2),x=a(s/2);switch(r){case"XYZ":this._x=d*h*u+c*m*x,this._y=c*m*u-d*h*x,this._z=c*h*x+d*m*u,this._w=c*h*u-d*m*x;break;case"YXZ":this._x=d*h*u+c*m*x,this._y=c*m*u-d*h*x,this._z=c*h*x-d*m*u,this._w=c*h*u+d*m*x;break;case"ZXY":this._x=d*h*u-c*m*x,this._y=c*m*u+d*h*x,this._z=c*h*x+d*m*u,this._w=c*h*u-d*m*x;break;case"ZYX":this._x=d*h*u-c*m*x,this._y=c*m*u+d*h*x,this._z=c*h*x-d*m*u,this._w=c*h*u+d*m*x;break;case"YZX":this._x=d*h*u+c*m*x,this._y=c*m*u+d*h*x,this._z=c*h*x-d*m*u,this._w=c*h*u-d*m*x;break;case"XZY":this._x=d*h*u-c*m*x,this._y=c*m*u-d*h*x,this._z=c*h*x+d*m*u,this._w=c*h*u+d*m*x;break;default:Vt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],i=e[4],s=e[8],r=e[1],l=e[5],a=e[9],c=e[2],h=e[6],u=e[10],d=n+l+u;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(h-a)*m,this._y=(s-c)*m,this._z=(r-i)*m}else if(n>l&&n>u){let m=2*Math.sqrt(1+n-l-u);this._w=(h-a)/m,this._x=.25*m,this._y=(i+r)/m,this._z=(s+c)/m}else if(l>u){let m=2*Math.sqrt(1+l-n-u);this._w=(s-c)/m,this._x=(i+r)/m,this._y=.25*m,this._z=(a+h)/m}else{let m=2*Math.sqrt(1+u-n-l);this._w=(r-i)/m,this._x=(s+c)/m,this._y=(a+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(pt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,l=e._x,a=e._y,c=e._z,h=e._w;return this._x=n*h+r*l+i*c-s*a,this._y=i*h+r*a+s*l-n*c,this._z=s*h+r*c+n*a-i*l,this._w=r*h-n*l-i*a-s*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,l=this.dot(t);l<0&&(n=-n,i=-i,s=-s,r=-r,l=-l);let a=1-e;if(l<.9995){let c=Math.acos(l),h=Math.sin(c);a=Math.sin(a*c)/h,e=Math.sin(e*c)/h,this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this._onChangeCallback()}else this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},E=class o{static{o.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(pr.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(pr.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=t.elements,r=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*r,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*r,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*r,this}applyQuaternion(t){let e=this.x,n=this.y,i=this.z,s=t.x,r=t.y,l=t.z,a=t.w,c=2*(r*i-l*n),h=2*(l*e-s*i),u=2*(s*n-r*e);return this.x=e+a*c+r*u-l*h,this.y=n+a*h+l*c-s*u,this.z=i+a*u+s*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=pt(this.x,t.x,e.x),this.y=pt(this.y,t.y,e.y),this.z=pt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=pt(this.x,t,e),this.y=pt(this.y,t,e),this.z=pt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(pt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,i=t.y,s=t.z,r=e.x,l=e.y,a=e.z;return this.x=i*a-s*l,this.y=s*r-n*a,this.z=n*l-i*r,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return cs.copy(this).projectOnVector(t),this.sub(cs)}reflect(t){return this.sub(cs.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(pt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},cs=new E,pr=new Ue,ut=class o{static{o.prototype.isMatrix3=!0}constructor(t,e,n,i,s,r,l,a,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,l,a,c)}set(t,e,n,i,s,r,l,a,c){let h=this.elements;return h[0]=t,h[1]=i,h[2]=l,h[3]=e,h[4]=s,h[5]=a,h[6]=n,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],l=n[3],a=n[6],c=n[1],h=n[4],u=n[7],d=n[2],m=n[5],x=n[8],C=i[0],O=i[3],V=i[6],B=i[1],U=i[4],D=i[7],$=i[2],it=i[5],et=i[8];return s[0]=r*C+l*B+a*$,s[3]=r*O+l*U+a*it,s[6]=r*V+l*D+a*et,s[1]=c*C+h*B+u*$,s[4]=c*O+h*U+u*it,s[7]=c*V+h*D+u*et,s[2]=d*C+m*B+x*$,s[5]=d*O+m*U+x*it,s[8]=d*V+m*D+x*et,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],l=t[5],a=t[6],c=t[7],h=t[8];return e*r*h-e*l*c-n*s*h+n*l*a+i*s*c-i*r*a}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],l=t[5],a=t[6],c=t[7],h=t[8],u=h*r-l*c,d=l*a-h*s,m=c*s-r*a,x=e*u+n*d+i*m;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let C=1/x;return t[0]=u*C,t[1]=(i*c-h*n)*C,t[2]=(l*n-i*r)*C,t[3]=d*C,t[4]=(h*e-i*a)*C,t[5]=(i*s-l*e)*C,t[6]=m*C,t[7]=(n*a-c*e)*C,t[8]=(r*e-n*s)*C,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,r,l){let a=Math.cos(s),c=Math.sin(s);return this.set(n*a,n*c,-n*(a*r+c*l)+r+t,-i*c,i*a,-i*(-c*r+a*l)+l+e,0,0,1),this}scale(t,e){return An("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(hs.makeScale(t,e)),this}rotate(t){return An("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(hs.makeRotation(-t)),this}translate(t,e){return An("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(hs.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},hs=new ut,mr=new ut().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),gr=new ut().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Eo(){let o={enabled:!0,workingColorSpace:Hs,spaces:{},convert:function(i,s,r){return this.enabled===!1||s===r||!s||!r||(this.spaces[s].transfer===wi&&(i.r=Ne(i.r),i.g=Ne(i.g),i.b=Ne(i.b)),this.spaces[s].primaries!==this.spaces[r].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===wi&&(i.r=Rn(i.r),i.g=Rn(i.g),i.b=Rn(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===lr?Gs:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,r){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return An("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return An("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(i,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return o.define({[Hs]:{primaries:t,whitePoint:n,transfer:Gs,toXYZ:mr,fromXYZ:gr,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:le},outputColorSpaceConfig:{drawingBufferColorSpace:le}},[le]:{primaries:t,whitePoint:n,transfer:wi,toXYZ:mr,fromXYZ:gr,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:le}}}),o}var ye=Eo();function Ne(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function Rn(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}var gn,Ci=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{gn===void 0&&(gn=Xs("canvas")),gn.width=t.width,gn.height=t.height;let i=gn.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=gn}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Xs("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let r=0;r<s.length;r++)s[r]=Ne(s[r]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ne(e[n]/255)*255):e[n]=Ne(e[n]);return{data:e,width:t.width,height:t.height}}else return Vt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},To=0,Ii=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:To++}),this.uuid=si(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let r=0,l=i.length;r<l;r++)i[r].isDataTexture?s.push(us(i[r].image)):s.push(us(i[r]))}else s=us(i);n.url=s}return e||(t.images[this.uuid]=n),n}};function us(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?Ci.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(Vt("Texture: Unable to serialize Texture."),{})}var Ao=0,fs=new E,cn=class o extends Ze{constructor(t=o.DEFAULT_IMAGE,e=o.DEFAULT_MAPPING,n=kn,i=kn,s=Ji,r=$i,l=Ki,a=Wr,c=o.DEFAULT_ANISOTROPY,h=lr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ao++}),this.uuid=si(),this.name="",this.source=new Ii(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=r,this.anisotropy=c,this.format=l,this.internalFormat=null,this.type=a,this.offset=new At(0,0),this.repeat=new At(1,1),this.center=new At(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ut,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(fs).x}get height(){return this.source.getSize(fs).y}get depth(){return this.source.getSize(fs).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Vt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Vt(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==or)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Gn:t.x=t.x-Math.floor(t.x);break;case kn:t.x=t.x<0?0:1;break;case Fs:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Gn:t.y=t.y-Math.floor(t.y);break;case kn:t.y=t.y<0?0:1;break;case Fs:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};cn.DEFAULT_IMAGE=null;cn.DEFAULT_MAPPING=or;cn.DEFAULT_ANISOTROPY=1;var Cn=class o{static{o.prototype.isVector4=!0}constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i+r[12]*s,this.y=r[1]*e+r[5]*n+r[9]*i+r[13]*s,this.z=r[2]*e+r[6]*n+r[10]*i+r[14]*s,this.w=r[3]*e+r[7]*n+r[11]*i+r[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s,a=t.elements,c=a[0],h=a[4],u=a[8],d=a[1],m=a[5],x=a[9],C=a[2],O=a[6],V=a[10];if(Math.abs(h-d)<.01&&Math.abs(u-C)<.01&&Math.abs(x-O)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+C)<.1&&Math.abs(x+O)<.1&&Math.abs(c+m+V-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let U=(c+1)/2,D=(m+1)/2,$=(V+1)/2,it=(h+d)/4,et=(u+C)/4,J=(x+O)/4;return U>D&&U>$?U<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(U),i=it/n,s=et/n):D>$?D<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(D),n=it/i,s=J/i):$<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt($),n=et/s,i=J/s),this.set(n,i,s,e),this}let B=Math.sqrt((O-x)*(O-x)+(u-C)*(u-C)+(d-h)*(d-h));return Math.abs(B)<.001&&(B=1),this.x=(O-x)/B,this.y=(u-C)/B,this.z=(d-h)/B,this.w=Math.acos((c+m+V-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=pt(this.x,t.x,e.x),this.y=pt(this.y,t.y,e.y),this.z=pt(this.z,t.z,e.z),this.w=pt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=pt(this.x,t,e),this.y=pt(this.y,t,e),this.z=pt(this.z,t,e),this.w=pt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(pt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var pe=class o{static{o.prototype.isMatrix4=!0}constructor(t,e,n,i,s,r,l,a,c,h,u,d,m,x,C,O){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,l,a,c,h,u,d,m,x,C,O)}set(t,e,n,i,s,r,l,a,c,h,u,d,m,x,C,O){let V=this.elements;return V[0]=t,V[4]=e,V[8]=n,V[12]=i,V[1]=s,V[5]=r,V[9]=l,V[13]=a,V[2]=c,V[6]=h,V[10]=u,V[14]=d,V[3]=m,V[7]=x,V[11]=C,V[15]=O,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new o().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,i=1/_n.setFromMatrixColumn(t,0).length(),s=1/_n.setFromMatrixColumn(t,1).length(),r=1/_n.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,i=t.y,s=t.z,r=Math.cos(n),l=Math.sin(n),a=Math.cos(i),c=Math.sin(i),h=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){let d=r*h,m=r*u,x=l*h,C=l*u;e[0]=a*h,e[4]=-a*u,e[8]=c,e[1]=m+x*c,e[5]=d-C*c,e[9]=-l*a,e[2]=C-d*c,e[6]=x+m*c,e[10]=r*a}else if(t.order==="YXZ"){let d=a*h,m=a*u,x=c*h,C=c*u;e[0]=d+C*l,e[4]=x*l-m,e[8]=r*c,e[1]=r*u,e[5]=r*h,e[9]=-l,e[2]=m*l-x,e[6]=C+d*l,e[10]=r*a}else if(t.order==="ZXY"){let d=a*h,m=a*u,x=c*h,C=c*u;e[0]=d-C*l,e[4]=-r*u,e[8]=x+m*l,e[1]=m+x*l,e[5]=r*h,e[9]=C-d*l,e[2]=-r*c,e[6]=l,e[10]=r*a}else if(t.order==="ZYX"){let d=r*h,m=r*u,x=l*h,C=l*u;e[0]=a*h,e[4]=x*c-m,e[8]=d*c+C,e[1]=a*u,e[5]=C*c+d,e[9]=m*c-x,e[2]=-c,e[6]=l*a,e[10]=r*a}else if(t.order==="YZX"){let d=r*a,m=r*c,x=l*a,C=l*c;e[0]=a*h,e[4]=C-d*u,e[8]=x*u+m,e[1]=u,e[5]=r*h,e[9]=-l*h,e[2]=-c*h,e[6]=m*u+x,e[10]=d-C*u}else if(t.order==="XZY"){let d=r*a,m=r*c,x=l*a,C=l*c;e[0]=a*h,e[4]=-u,e[8]=c*h,e[1]=d*u+C,e[5]=r*h,e[9]=m*u-x,e[2]=x*u-m,e[6]=l*h,e[10]=C*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Ro,t,Co)}lookAt(t,e,n){let i=this.elements;return fe.subVectors(t,e),fe.lengthSq()===0&&(fe.z=1),fe.normalize(),Ge.crossVectors(n,fe),Ge.lengthSq()===0&&(Math.abs(n.z)===1?fe.x+=1e-4:fe.z+=1e-4,fe.normalize(),Ge.crossVectors(n,fe)),Ge.normalize(),ri.crossVectors(fe,Ge),i[0]=Ge.x,i[4]=ri.x,i[8]=fe.x,i[1]=Ge.y,i[5]=ri.y,i[9]=fe.y,i[2]=Ge.z,i[6]=ri.z,i[10]=fe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],l=n[4],a=n[8],c=n[12],h=n[1],u=n[5],d=n[9],m=n[13],x=n[2],C=n[6],O=n[10],V=n[14],B=n[3],U=n[7],D=n[11],$=n[15],it=i[0],et=i[4],J=i[8],rt=i[12],ot=i[1],ht=i[5],st=i[9],ct=i[13],Mt=i[2],ft=i[6],Ht=i[10],Gt=i[14],Bt=i[3],yt=i[7],xt=i[11],bt=i[15];return s[0]=r*it+l*ot+a*Mt+c*Bt,s[4]=r*et+l*ht+a*ft+c*yt,s[8]=r*J+l*st+a*Ht+c*xt,s[12]=r*rt+l*ct+a*Gt+c*bt,s[1]=h*it+u*ot+d*Mt+m*Bt,s[5]=h*et+u*ht+d*ft+m*yt,s[9]=h*J+u*st+d*Ht+m*xt,s[13]=h*rt+u*ct+d*Gt+m*bt,s[2]=x*it+C*ot+O*Mt+V*Bt,s[6]=x*et+C*ht+O*ft+V*yt,s[10]=x*J+C*st+O*Ht+V*xt,s[14]=x*rt+C*ct+O*Gt+V*bt,s[3]=B*it+U*ot+D*Mt+$*Bt,s[7]=B*et+U*ht+D*ft+$*yt,s[11]=B*J+U*st+D*Ht+$*xt,s[15]=B*rt+U*ct+D*Gt+$*bt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],r=t[1],l=t[5],a=t[9],c=t[13],h=t[2],u=t[6],d=t[10],m=t[14],x=t[3],C=t[7],O=t[11],V=t[15],B=a*m-c*d,U=l*m-c*u,D=l*d-a*u,$=r*m-c*h,it=r*d-a*h,et=r*u-l*h;return e*(C*B-O*U+V*D)-n*(x*B-O*$+V*it)+i*(x*U-C*$+V*et)-s*(x*D-C*it+O*et)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[1],r=t[5],l=t[9],a=t[2],c=t[6],h=t[10];return e*(r*h-l*c)-n*(s*h-l*a)+i*(s*c-r*a)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],l=t[5],a=t[6],c=t[7],h=t[8],u=t[9],d=t[10],m=t[11],x=t[12],C=t[13],O=t[14],V=t[15],B=e*l-n*r,U=e*a-i*r,D=e*c-s*r,$=n*a-i*l,it=n*c-s*l,et=i*c-s*a,J=h*C-u*x,rt=h*O-d*x,ot=h*V-m*x,ht=u*O-d*C,st=u*V-m*C,ct=d*V-m*O,Mt=B*ct-U*st+D*ht+$*ot-it*rt+et*J;if(Mt===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let ft=1/Mt;return t[0]=(l*ct-a*st+c*ht)*ft,t[1]=(i*st-n*ct-s*ht)*ft,t[2]=(C*et-O*it+V*$)*ft,t[3]=(d*it-u*et-m*$)*ft,t[4]=(a*ot-r*ct-c*rt)*ft,t[5]=(e*ct-i*ot+s*rt)*ft,t[6]=(O*D-x*et-V*U)*ft,t[7]=(h*et-d*D+m*U)*ft,t[8]=(r*st-l*ot+c*J)*ft,t[9]=(n*ot-e*st-s*J)*ft,t[10]=(x*it-C*D+V*B)*ft,t[11]=(u*D-h*it-m*B)*ft,t[12]=(l*rt-r*ht-a*J)*ft,t[13]=(e*ht-n*rt+i*J)*ft,t[14]=(C*U-x*$-O*B)*ft,t[15]=(h*$-u*U+d*B)*ft,this}scale(t){let e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),i=Math.sin(e),s=1-n,r=t.x,l=t.y,a=t.z,c=s*r,h=s*l;return this.set(c*r+n,c*l-i*a,c*a+i*l,0,c*l+i*a,h*l+n,h*a-i*r,0,c*a-i*l,h*a+i*r,s*a*a+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,r){return this.set(1,n,s,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){let i=this.elements,s=e._x,r=e._y,l=e._z,a=e._w,c=s+s,h=r+r,u=l+l,d=s*c,m=s*h,x=s*u,C=r*h,O=r*u,V=l*u,B=a*c,U=a*h,D=a*u,$=n.x,it=n.y,et=n.z;return i[0]=(1-(C+V))*$,i[1]=(m+D)*$,i[2]=(x-U)*$,i[3]=0,i[4]=(m-D)*it,i[5]=(1-(d+V))*it,i[6]=(O+B)*it,i[7]=0,i[8]=(x+U)*et,i[9]=(O-B)*et,i[10]=(1-(d+C))*et,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){let i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];let s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let r=_n.set(i[0],i[1],i[2]).length(),l=_n.set(i[4],i[5],i[6]).length(),a=_n.set(i[8],i[9],i[10]).length();s<0&&(r=-r),Me.copy(this);let c=1/r,h=1/l,u=1/a;return Me.elements[0]*=c,Me.elements[1]*=c,Me.elements[2]*=c,Me.elements[4]*=h,Me.elements[5]*=h,Me.elements[6]*=h,Me.elements[8]*=u,Me.elements[9]*=u,Me.elements[10]*=u,e.setFromRotationMatrix(Me),n.x=r,n.y=l,n.z=a,this}makePerspective(t,e,n,i,s,r,l=Vn,a=!1){let c=this.elements,h=2*s/(e-t),u=2*s/(n-i),d=(e+t)/(e-t),m=(n+i)/(n-i),x,C;if(a)x=s/(r-s),C=r*s/(r-s);else if(l===Vn)x=-(r+s)/(r-s),C=-2*r*s/(r-s);else if(l===Ws)x=-r/(r-s),C=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=C,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,s,r,l=Vn,a=!1){let c=this.elements,h=2/(e-t),u=2/(n-i),d=-(e+t)/(e-t),m=-(n+i)/(n-i),x,C;if(a)x=1/(r-s),C=r/(r-s);else if(l===Vn)x=-2/(r-s),C=-(r+s)/(r-s);else if(l===Ws)x=-1/(r-s),C=-s/(r-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=x,c[14]=C,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},_n=new E,Me=new pe,Ro=new E(0,0,0),Co=new E(1,1,1),Ge=new E,ri=new E,fe=new E,_r=new pe,xr=new Ue,hn=class o{constructor(t=0,e=0,n=0,i=o.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let i=t.elements,s=i[0],r=i[4],l=i[8],a=i[1],c=i[5],h=i[9],u=i[2],d=i[6],m=i[10];switch(e){case"XYZ":this._y=Math.asin(pt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-pt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(l,m),this._z=Math.atan2(a,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(pt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(a,s));break;case"ZYX":this._y=Math.asin(-pt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(a,s)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(pt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(l,m));break;case"XZY":this._z=Math.asin(-pt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(l,s)):(this._x=Math.atan2(-h,m),this._y=0);break;default:Vt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return _r.makeRotationFromQuaternion(t),this.setFromRotationMatrix(_r,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return xr.setFromEuler(this),this.setFromQuaternion(xr,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};hn.DEFAULT_ORDER="XYZ";var Pi=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Io=0,yr=new E,xn=new Ue,Ce=new pe,oi=new E,Fn=new E,Po=new E,Lo=new Ue,vr=new E(1,0,0),Mr=new E(0,1,0),br=new E(0,0,1),Sr={type:"added"},Do={type:"removed"},yn={type:"childadded",child:null},ds={type:"childremoved",child:null},Fe=class o extends Ze{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Io++}),this.uuid=si(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=o.DEFAULT_UP.clone();let t=new E,e=new hn,n=new Ue,i=new E(1,1,1);function s(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new pe},normalMatrix:{value:new ut}}),this.matrix=new pe,this.matrixWorld=new pe,this.matrixAutoUpdate=o.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=o.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Pi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return xn.setFromAxisAngle(t,e),this.quaternion.multiply(xn),this}rotateOnWorldAxis(t,e){return xn.setFromAxisAngle(t,e),this.quaternion.premultiply(xn),this}rotateX(t){return this.rotateOnAxis(vr,t)}rotateY(t){return this.rotateOnAxis(Mr,t)}rotateZ(t){return this.rotateOnAxis(br,t)}translateOnAxis(t,e){return yr.copy(t).applyQuaternion(this.quaternion),this.position.add(yr.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(vr,t)}translateY(t){return this.translateOnAxis(Mr,t)}translateZ(t){return this.translateOnAxis(br,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Ce.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?oi.copy(t):oi.set(t,e,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Fn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ce.lookAt(Fn,oi,this.up):Ce.lookAt(oi,Fn,this.up),this.quaternion.setFromRotationMatrix(Ce),i&&(Ce.extractRotation(i.matrixWorld),xn.setFromRotationMatrix(Ce),this.quaternion.premultiply(xn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Dt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Sr),yn.child=t,this.dispatchEvent(yn),yn.child=null):Dt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Do),ds.child=t,this.dispatchEvent(ds),ds.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Ce.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Ce.multiply(t.parent.matrixWorld)),t.applyMatrix4(Ce),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Sr),yn.child=t,this.dispatchEvent(yn),yn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){let r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let i=this.children;for(let s=0,r=i.length;s<r;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fn,t,Po),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fn,Lo,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,i=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*i,s[13]+=n-s[1]*e-s[5]*n-s[9]*i,s[14]+=i-s[2]*e-s[6]*n-s[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let s=this.children;for(let r=0,l=s.length;r<l;r++)s[r].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(l=>({...l,boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(l=>({...l})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(l,a){return l[a.uuid]===void 0&&(l[a.uuid]=a.toJSON(t)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let a=l.shapes;if(Array.isArray(a))for(let c=0,h=a.length;c<h;c++){let u=a[c];s(t.shapes,u)}else s(t.shapes,a)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let a=0,c=this.material.length;a<c;a++)l.push(s(t.materials,this.material[a]));i.material=l}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let l=0;l<this.children.length;l++)i.children.push(this.children[l].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let l=0;l<this.animations.length;l++){let a=this.animations[l];i.animations.push(s(t.animations,a))}}if(e){let l=r(t.geometries),a=r(t.materials),c=r(t.textures),h=r(t.images),u=r(t.shapes),d=r(t.skeletons),m=r(t.animations),x=r(t.nodes);l.length>0&&(n.geometries=l),a.length>0&&(n.materials=a),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),x.length>0&&(n.nodes=x)}return n.object=i,n;function r(l){let a=[];for(let c in l){let h=l[c];delete h.metadata,a.push(h)}return a}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Fe.DEFAULT_UP=new E(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Xn=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}};var $r={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},We={h:0,s:0,l:0},ai={h:0,s:0,l:0};function ps(o,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?o+(t-o)*6*e:e<1/2?t:e<2/3?o+(t-o)*6*(2/3-e):o}var mt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=le){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ye.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=ye.workingColorSpace){return this.r=t,this.g=e,this.b=n,ye.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=ye.workingColorSpace){if(t=wo(t,1),e=pt(e,0,1),n=pt(n,0,1),e===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+e):n+e-n*e,r=2*n-s;this.r=ps(r,s,t+1/3),this.g=ps(r,s,t),this.b=ps(r,s,t-1/3)}return ye.colorSpaceToWorking(this,i),this}setStyle(t,e=le){function n(s){s!==void 0&&parseFloat(s)<1&&Vt("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s,r=i[1],l=i[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Vt("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){let s=i[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);Vt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=le){let n=$r[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Vt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ne(t.r),this.g=Ne(t.g),this.b=Ne(t.b),this}copyLinearToSRGB(t){return this.r=Rn(t.r),this.g=Rn(t.g),this.b=Rn(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=le){return ye.workingToColorSpace(jt.copy(this),t),Math.round(pt(jt.r*255,0,255))*65536+Math.round(pt(jt.g*255,0,255))*256+Math.round(pt(jt.b*255,0,255))}getHexString(t=le){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ye.workingColorSpace){ye.workingToColorSpace(jt.copy(this),e);let n=jt.r,i=jt.g,s=jt.b,r=Math.max(n,i,s),l=Math.min(n,i,s),a,c,h=(l+r)/2;if(l===r)a=0,c=0;else{let u=r-l;switch(c=h<=.5?u/(r+l):u/(2-r-l),r){case n:a=(i-s)/u+(i<s?6:0);break;case i:a=(s-n)/u+2;break;case s:a=(n-i)/u+4;break}a/=6}return t.h=a,t.s=c,t.l=h,t}getRGB(t,e=ye.workingColorSpace){return ye.workingToColorSpace(jt.copy(this),e),t.r=jt.r,t.g=jt.g,t.b=jt.b,t}getStyle(t=le){ye.workingToColorSpace(jt.copy(this),t);let e=jt.r,n=jt.g,i=jt.b;return t!==le?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(We),this.setHSL(We.h+t,We.s+e,We.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(We),t.getHSL(ai);let n=ls(We.h,ai.h,e),i=ls(We.s,ai.s,e),s=ls(We.l,ai.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},jt=new mt;mt.NAMES=$r;var be=new E,Ie=new E,ms=new E,Pe=new E,vn=new E,Mn=new E,wr=new E,gs=new E,_s=new E,xs=new E,ys=new Cn,vs=new Cn,Ms=new Cn,Ye=class o{constructor(t=new E,e=new E,n=new E){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),be.subVectors(t,e),i.cross(be);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){be.subVectors(i,e),Ie.subVectors(n,e),ms.subVectors(t,e);let r=be.dot(be),l=be.dot(Ie),a=be.dot(ms),c=Ie.dot(Ie),h=Ie.dot(ms),u=r*c-l*l;if(u===0)return s.set(0,0,0),null;let d=1/u,m=(c*a-l*h)*d,x=(r*h-l*a)*d;return s.set(1-m-x,x,m)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Pe)===null?!1:Pe.x>=0&&Pe.y>=0&&Pe.x+Pe.y<=1}static getInterpolation(t,e,n,i,s,r,l,a){return this.getBarycoord(t,e,n,i,Pe)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(s,Pe.x),a.addScaledVector(r,Pe.y),a.addScaledVector(l,Pe.z),a)}static getInterpolatedAttribute(t,e,n,i,s,r){return ys.setScalar(0),vs.setScalar(0),Ms.setScalar(0),ys.fromBufferAttribute(t,e),vs.fromBufferAttribute(t,n),Ms.fromBufferAttribute(t,i),r.setScalar(0),r.addScaledVector(ys,s.x),r.addScaledVector(vs,s.y),r.addScaledVector(Ms,s.z),r}static isFrontFacing(t,e,n,i){return be.subVectors(n,e),Ie.subVectors(t,e),be.cross(Ie).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return be.subVectors(this.c,this.b),Ie.subVectors(this.a,this.b),be.cross(Ie).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return o.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return o.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return o.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return o.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return o.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,i=this.b,s=this.c,r,l;vn.subVectors(i,n),Mn.subVectors(s,n),gs.subVectors(t,n);let a=vn.dot(gs),c=Mn.dot(gs);if(a<=0&&c<=0)return e.copy(n);_s.subVectors(t,i);let h=vn.dot(_s),u=Mn.dot(_s);if(h>=0&&u<=h)return e.copy(i);let d=a*u-h*c;if(d<=0&&a>=0&&h<=0)return r=a/(a-h),e.copy(n).addScaledVector(vn,r);xs.subVectors(t,s);let m=vn.dot(xs),x=Mn.dot(xs);if(x>=0&&m<=x)return e.copy(s);let C=m*c-a*x;if(C<=0&&c>=0&&x<=0)return l=c/(c-x),e.copy(n).addScaledVector(Mn,l);let O=h*x-m*u;if(O<=0&&u-h>=0&&m-x>=0)return wr.subVectors(s,i),l=(u-h)/(u-h+(m-x)),e.copy(i).addScaledVector(wr,l);let V=1/(O+C+d);return r=C*V,l=d*V,e.copy(n).addScaledVector(vn,r).addScaledVector(Mn,l)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Je=class{constructor(t=new E(1/0,1/0,1/0),e=new E(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Se.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Se.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Se.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,l=s.count;r<l;r++)t.isMesh===!0?t.getVertexPosition(r,Se):Se.fromBufferAttribute(s,r),Se.applyMatrix4(t.matrixWorld),this.expandByPoint(Se);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),li.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),li.copy(n.boundingBox)),li.applyMatrix4(t.matrixWorld),this.union(li)}let i=t.children;for(let s=0,r=i.length;s<r;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Se),Se.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(On),ci.subVectors(this.max,On),bn.subVectors(t.a,On),Sn.subVectors(t.b,On),wn.subVectors(t.c,On),Xe.subVectors(Sn,bn),qe.subVectors(wn,Sn),on.subVectors(bn,wn);let e=[0,-Xe.z,Xe.y,0,-qe.z,qe.y,0,-on.z,on.y,Xe.z,0,-Xe.x,qe.z,0,-qe.x,on.z,0,-on.x,-Xe.y,Xe.x,0,-qe.y,qe.x,0,-on.y,on.x,0];return!bs(e,bn,Sn,wn,ci)||(e=[1,0,0,0,1,0,0,0,1],!bs(e,bn,Sn,wn,ci))?!1:(hi.crossVectors(Xe,qe),e=[hi.x,hi.y,hi.z],bs(e,bn,Sn,wn,ci))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Se).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Se).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Le[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Le[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Le[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Le[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Le[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Le[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Le[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Le[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Le),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Le=[new E,new E,new E,new E,new E,new E,new E,new E],Se=new E,li=new Je,bn=new E,Sn=new E,wn=new E,Xe=new E,qe=new E,on=new E,On=new E,ci=new E,hi=new E,an=new E;function bs(o,t,e,n,i){for(let s=0,r=o.length-3;s<=r;s+=3){an.fromArray(o,s);let l=i.x*Math.abs(an.x)+i.y*Math.abs(an.y)+i.z*Math.abs(an.z),a=t.dot(an),c=e.dot(an),h=n.dot(an);if(Math.max(-Math.max(a,c,h),Math.min(a,c,h))>l)return!1}return!0}var kt=new E,ui=new At,No=0,Ft=class extends Ze{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:No++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Zr,this.updateRanges=[],this.gpuType=Xr,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ui.fromBufferAttribute(this,e),ui.applyMatrix3(t),this.setXY(e,ui.x,ui.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)kt.fromBufferAttribute(this,e),kt.applyMatrix3(t),this.setXYZ(e,kt.x,kt.y,kt.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)kt.fromBufferAttribute(this,e),kt.applyMatrix4(t),this.setXYZ(e,kt.x,kt.y,kt.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)kt.fromBufferAttribute(this,e),kt.applyNormalMatrix(t),this.setXYZ(e,kt.x,kt.y,kt.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)kt.fromBufferAttribute(this,e),kt.transformDirection(t),this.setXYZ(e,kt.x,kt.y,kt.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Un(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ae(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Un(e,this.array)),e}setX(t,e){return this.normalized&&(e=ae(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Un(e,this.array)),e}setY(t,e){return this.normalized&&(e=ae(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Un(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ae(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Un(e,this.array)),e}setW(t,e){return this.normalized&&(e=ae(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ae(e,this.array),n=ae(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=ae(e,this.array),n=ae(n,this.array),i=ae(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=ae(e,this.array),n=ae(n,this.array),i=ae(i,this.array),s=ae(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Li=class extends Ft{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Di=class extends Ft{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var te=class extends Ft{constructor(t,e,n){super(new Float32Array(t),e,n)}},Uo=new Je,Bn=new E,Ss=new E,qn=class{constructor(t=new E,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Uo.setFromPoints(t).getCenter(n);let i=0;for(let s=0,r=t.length;s<r;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Bn.subVectors(t,this.center);let e=Bn.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(Bn,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ss.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Bn.copy(t.center).add(Ss)),this.expandByPoint(Bn.copy(t.center).sub(Ss))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Fo=0,xe=new pe,ws=new Fe,En=new E,de=new Je,zn=new Je,Yt=new E,me=class o extends Ze{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Fo++}),this.uuid=si(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(vo(t)?Di:Li)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new ut().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return xe.makeRotationFromQuaternion(t),this.applyMatrix4(xe),this}rotateX(t){return xe.makeRotationX(t),this.applyMatrix4(xe),this}rotateY(t){return xe.makeRotationY(t),this.applyMatrix4(xe),this}rotateZ(t){return xe.makeRotationZ(t),this.applyMatrix4(xe),this}translate(t,e,n){return xe.makeTranslation(t,e,n),this.applyMatrix4(xe),this}scale(t,e,n){return xe.makeScale(t,e,n),this.applyMatrix4(xe),this}lookAt(t){return ws.lookAt(t),ws.updateMatrix(),this.applyMatrix4(ws.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(En).negate(),this.translate(En.x,En.y,En.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let i=0,s=t.length;i<s;i++){let r=t[i];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new te(n,3))}else{let n=Math.min(t.length,e.count);for(let i=0;i<n;i++){let s=t[i];e.setXYZ(i,s.x,s.y,s.z||0)}t.length>e.count&&Vt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Je);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Dt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new E(-1/0,-1/0,-1/0),new E(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){let s=e[n];de.setFromBufferAttribute(s),this.morphTargetsRelative?(Yt.addVectors(this.boundingBox.min,de.min),this.boundingBox.expandByPoint(Yt),Yt.addVectors(this.boundingBox.max,de.max),this.boundingBox.expandByPoint(Yt)):(this.boundingBox.expandByPoint(de.min),this.boundingBox.expandByPoint(de.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Dt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new qn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Dt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new E,1/0);return}if(t){let n=this.boundingSphere.center;if(de.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){let l=e[s];zn.setFromBufferAttribute(l),this.morphTargetsRelative?(Yt.addVectors(de.min,zn.min),de.expandByPoint(Yt),Yt.addVectors(de.max,zn.max),de.expandByPoint(Yt)):(de.expandByPoint(zn.min),de.expandByPoint(zn.max))}de.getCenter(n);let i=0;for(let s=0,r=t.count;s<r;s++)Yt.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Yt));if(e)for(let s=0,r=e.length;s<r;s++){let l=e[s],a=this.morphTargetsRelative;for(let c=0,h=l.count;c<h;c++)Yt.fromBufferAttribute(l,c),a&&(En.fromBufferAttribute(t,c),Yt.add(En)),i=Math.max(i,n.distanceToSquared(Yt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Dt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Dt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,i=e.normal,s=e.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==n.count)&&(r=new Ft(new Float32Array(4*n.count),4),this.setAttribute("tangent",r));let l=[],a=[];for(let J=0;J<n.count;J++)l[J]=new E,a[J]=new E;let c=new E,h=new E,u=new E,d=new At,m=new At,x=new At,C=new E,O=new E;function V(J,rt,ot){c.fromBufferAttribute(n,J),h.fromBufferAttribute(n,rt),u.fromBufferAttribute(n,ot),d.fromBufferAttribute(s,J),m.fromBufferAttribute(s,rt),x.fromBufferAttribute(s,ot),h.sub(c),u.sub(c),m.sub(d),x.sub(d);let ht=1/(m.x*x.y-x.x*m.y);isFinite(ht)&&(C.copy(h).multiplyScalar(x.y).addScaledVector(u,-m.y).multiplyScalar(ht),O.copy(u).multiplyScalar(m.x).addScaledVector(h,-x.x).multiplyScalar(ht),l[J].add(C),l[rt].add(C),l[ot].add(C),a[J].add(O),a[rt].add(O),a[ot].add(O))}let B=this.groups;B.length===0&&(B=[{start:0,count:t.count}]);for(let J=0,rt=B.length;J<rt;++J){let ot=B[J],ht=ot.start,st=ot.count;for(let ct=ht,Mt=ht+st;ct<Mt;ct+=3)V(t.getX(ct+0),t.getX(ct+1),t.getX(ct+2))}let U=new E,D=new E,$=new E,it=new E;function et(J){$.fromBufferAttribute(i,J),it.copy($);let rt=l[J];U.copy(rt),U.sub($.multiplyScalar($.dot(rt))).normalize(),D.crossVectors(it,rt);let ht=D.dot(a[J])<0?-1:1;r.setXYZW(J,U.x,U.y,U.z,ht)}for(let J=0,rt=B.length;J<rt;++J){let ot=B[J],ht=ot.start,st=ot.count;for(let ct=ht,Mt=ht+st;ct<Mt;ct+=3)et(t.getX(ct+0)),et(t.getX(ct+1)),et(t.getX(ct+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Ft(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let i=new E,s=new E,r=new E,l=new E,a=new E,c=new E,h=new E,u=new E;if(t)for(let d=0,m=t.count;d<m;d+=3){let x=t.getX(d+0),C=t.getX(d+1),O=t.getX(d+2);i.fromBufferAttribute(e,x),s.fromBufferAttribute(e,C),r.fromBufferAttribute(e,O),h.subVectors(r,s),u.subVectors(i,s),h.cross(u),l.fromBufferAttribute(n,x),a.fromBufferAttribute(n,C),c.fromBufferAttribute(n,O),l.add(h),a.add(h),c.add(h),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(C,a.x,a.y,a.z),n.setXYZ(O,c.x,c.y,c.z)}else for(let d=0,m=e.count;d<m;d+=3)i.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),r.fromBufferAttribute(e,d+2),h.subVectors(r,s),u.subVectors(i,s),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Yt.fromBufferAttribute(t,e),Yt.normalize(),t.setXYZ(e,Yt.x,Yt.y,Yt.z)}toNonIndexed(){function t(l,a){let c=l.array,h=l.itemSize,u=l.normalized,d=new c.constructor(a.length*h),m=0,x=0;for(let C=0,O=a.length;C<O;C++){l.isInterleavedBufferAttribute?m=a[C]*l.data.stride+l.offset:m=a[C]*h;for(let V=0;V<h;V++)d[x++]=c[m++]}return new Ft(d,h,u)}if(this.index===null)return Vt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new o,n=this.index.array,i=this.attributes;for(let l in i){let a=i[l],c=t(a,n);e.setAttribute(l,c)}let s=this.morphAttributes;for(let l in s){let a=[],c=s[l];for(let h=0,u=c.length;h<u;h++){let d=c[h],m=t(d,n);a.push(m)}e.morphAttributes[l]=a}e.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let l=0,a=r.length;l<a;l++){let c=r[l];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let c in a)a[c]!==void 0&&(t[c]=a[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let a in n){let c=n[a];t.data.attributes[a]=c.toJSON(t.data)}let i={},s=!1;for(let a in this.morphAttributes){let c=this.morphAttributes[a],h=[];for(let u=0,d=c.length;u<d;u++){let m=c[u];h.push(m.toJSON(t.data))}h.length>0&&(i[a]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let l=this.boundingSphere;return l!==null&&(t.data.boundingSphere=l.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let i=t.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(e))}let s=t.morphAttributes;for(let c in s){let h=[],u=s[c];for(let d=0,m=u.length;d<m;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,h=r.length;c<h;c++){let u=r[c];this.addGroup(u.start,u.count,u.materialIndex)}let l=t.boundingBox;l!==null&&(this.boundingBox=l.clone());let a=t.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Es=new E,Oo=new E,Bo=new ut,Ni=class{constructor(t=new E(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let i=Es.subVectors(n,e).cross(Oo.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let i=t.delta(Es),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(r<0||r>1)?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Bo.getNormalMatrix(t),i=this.coplanarPoint(Es).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},zo=0,Yn=class extends Ze{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:zo++}),this.uuid=si(),this.name="",this.type="Material",this.blending=Fr,this.side=Ks,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Br,this.blendDst=zr,this.blendEquation=Or,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new mt(0,0,0),this.blendAlpha=0,this.depthFunc=Ti,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Yr,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ei,this.stencilZFail=Ei,this.stencilZPass=Ei,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Vt(`Material: parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Vt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){let r=[];for(let l in s){let a=s[l];delete a.metadata,r.push(a)}return r}if(e){let s=i(t.textures),r=i(t.images);s.length>0&&(n.textures=s),r.length>0&&(n.images=r)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new mt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Ni().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new At().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new At().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var De=new E,Ts=new E,fi=new E,di=new E,Ui=class{constructor(t=new E,e=new E(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,De)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=De.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(De.copy(this.origin).addScaledVector(this.direction,e),De.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Ts.copy(t).add(e).multiplyScalar(.5),fi.copy(e).sub(t).normalize(),di.copy(this.origin).sub(Ts);let s=t.distanceTo(e)*.5,r=-this.direction.dot(fi),l=di.dot(this.direction),a=-di.dot(fi),c=di.lengthSq(),h=Math.abs(1-r*r),u,d,m,x;if(h>0)if(u=r*a-l,d=r*l-a,x=s*h,u>=0)if(d>=-x)if(d<=x){let C=1/h;u*=C,d*=C,m=u*(u+r*d+2*l)+d*(r*u+d+2*a)+c}else d=s,u=Math.max(0,-(r*d+l)),m=-u*u+d*(d+2*a)+c;else d=-s,u=Math.max(0,-(r*d+l)),m=-u*u+d*(d+2*a)+c;else d<=-x?(u=Math.max(0,-(-r*s+l)),d=u>0?-s:Math.min(Math.max(-s,-a),s),m=-u*u+d*(d+2*a)+c):d<=x?(u=0,d=Math.min(Math.max(-s,-a),s),m=d*(d+2*a)+c):(u=Math.max(0,-(r*s+l)),d=u>0?s:Math.min(Math.max(-s,-a),s),m=-u*u+d*(d+2*a)+c);else d=r>0?-s:s,u=Math.max(0,-(r*d+l)),m=-u*u+d*(d+2*a)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Ts).addScaledVector(fi,d),m}intersectSphere(t,e){if(t.radius<0)return null;De.subVectors(t.center,this.origin);let n=De.dot(this.direction),i=De.dot(De)-n*n,s=t.radius*t.radius;if(i>s)return null;let r=Math.sqrt(s-i),l=n-r,a=n+r;return a<0?null:l<0?this.at(a,e):this.at(l,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,r,l,a,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,i=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,i=(t.min.x-d.x)*c),h>=0?(s=(t.min.y-d.y)*h,r=(t.max.y-d.y)*h):(s=(t.max.y-d.y)*h,r=(t.min.y-d.y)*h),n>r||s>i||((s>n||isNaN(n))&&(n=s),(r<i||isNaN(i))&&(i=r),u>=0?(l=(t.min.z-d.z)*u,a=(t.max.z-d.z)*u):(l=(t.max.z-d.z)*u,a=(t.min.z-d.z)*u),n>a||l>i)||((l>n||n!==n)&&(n=l),(a<i||i!==i)&&(i=a),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,De)!==null}intersectTriangle(t,e,n,i,s){let r=this.origin,l=this.direction,a=l.x,c=l.y,h=l.z,u=t.x-r.x,d=t.y-r.y,m=t.z-r.z,x=e.x-r.x,C=e.y-r.y,O=e.z-r.z,V=n.x-r.x,B=n.y-r.y,U=n.z-r.z,D=Math.abs(a),$=Math.abs(c),it=Math.abs(h),et,J,rt,ot,ht,st,ct,Mt,ft,Ht,Gt,Bt;if(D>=$&&D>=it?(rt=a,st=u,ft=x,Bt=V,a>=0?(et=c,J=h,ot=d,ht=m,ct=C,Mt=O,Ht=B,Gt=U):(et=h,J=c,ot=m,ht=d,ct=O,Mt=C,Ht=U,Gt=B)):$>=it?(rt=c,st=d,ft=C,Bt=B,c>=0?(et=h,J=a,ot=m,ht=u,ct=O,Mt=x,Ht=U,Gt=V):(et=a,J=h,ot=u,ht=m,ct=x,Mt=O,Ht=V,Gt=U)):(rt=h,st=m,ft=O,Bt=U,h>=0?(et=a,J=c,ot=u,ht=d,ct=x,Mt=C,Ht=V,Gt=B):(et=c,J=a,ot=d,ht=u,ct=C,Mt=x,Ht=B,Gt=V)),rt===0)return null;let yt=et/rt,xt=J/rt,bt=1/rt,Wt=ot-yt*st,Zt=ht-xt*st,Pt=ct-yt*ft,Ut=Mt-xt*ft,Be=Ht-yt*Bt,fn=Gt-xt*Bt,ne=Be*Ut-fn*Pt,Xt=Wt*fn-Zt*Be,we=Pt*Zt-Ut*Wt;if(i){if(ne<0||Xt<0||we<0)return null}else if((ne<0||Xt<0||we<0)&&(ne>0||Xt>0||we>0))return null;let ze=ne+Xt+we;if(ze===0)return null;let Ot=bt*(ne*st+Xt*ft+we*Bt);return(ze>0?Ot<0:Ot>0)?null:this.at(Ot/ze,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Fi=class extends Yn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new mt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hn,this.combine=Qs,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Er=new pe,ln=new Ui,pi=new qn,Tr=new E,mi=new E,gi=new E,_i=new E,As=new E,xi=new E,Ar=new E,yi=new E,Zn=class extends Fe{constructor(t=new me,e=new Fi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){let l=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=s}}}}getVertexPosition(t,e){let n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(i,t);let l=this.morphTargetInfluences;if(s&&l){xi.set(0,0,0);for(let a=0,c=s.length;a<c;a++){let h=l[a],u=s[a];h!==0&&(As.fromBufferAttribute(u,t),r?xi.addScaledVector(As,h):xi.addScaledVector(As.sub(e),h))}e.add(xi)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),pi.copy(n.boundingSphere),pi.applyMatrix4(s),ln.copy(t.ray).recast(t.near),!(pi.containsPoint(ln.origin)===!1&&(ln.intersectSphere(pi,Tr)===null||ln.origin.distanceToSquared(Tr)>(t.far-t.near)**2))&&(Er.copy(s).invert(),ln.copy(t.ray).applyMatrix4(Er),!(n.boundingBox!==null&&ln.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ln)))}_computeIntersections(t,e,n){let i,s=this.geometry,r=this.material,l=s.index,a=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,m=s.drawRange;if(l!==null)if(Array.isArray(r))for(let x=0,C=d.length;x<C;x++){let O=d[x],V=r[O.materialIndex],B=Math.max(O.start,m.start),U=Math.min(l.count,Math.min(O.start+O.count,m.start+m.count));for(let D=B,$=U;D<$;D+=3){let it=l.getX(D),et=l.getX(D+1),J=l.getX(D+2);i=vi(this,V,t,n,c,h,u,it,et,J),i&&(i.faceIndex=Math.floor(D/3),i.face.materialIndex=O.materialIndex,e.push(i))}}else{let x=Math.max(0,m.start),C=Math.min(l.count,m.start+m.count);for(let O=x,V=C;O<V;O+=3){let B=l.getX(O),U=l.getX(O+1),D=l.getX(O+2);i=vi(this,r,t,n,c,h,u,B,U,D),i&&(i.faceIndex=Math.floor(O/3),e.push(i))}}else if(a!==void 0)if(Array.isArray(r))for(let x=0,C=d.length;x<C;x++){let O=d[x],V=r[O.materialIndex],B=Math.max(O.start,m.start),U=Math.min(a.count,Math.min(O.start+O.count,m.start+m.count));for(let D=B,$=U;D<$;D+=3){let it=D,et=D+1,J=D+2;i=vi(this,V,t,n,c,h,u,it,et,J),i&&(i.faceIndex=Math.floor(D/3),i.face.materialIndex=O.materialIndex,e.push(i))}}else{let x=Math.max(0,m.start),C=Math.min(a.count,m.start+m.count);for(let O=x,V=C;O<V;O+=3){let B=O,U=O+1,D=O+2;i=vi(this,r,t,n,c,h,u,B,U,D),i&&(i.faceIndex=Math.floor(O/3),e.push(i))}}}};function ko(o,t,e,n,i,s,r,l){let a;if(t.side===Ur?a=n.intersectTriangle(r,s,i,!0,l):a=n.intersectTriangle(i,s,r,t.side===Ks,l),a===null)return null;yi.copy(l),yi.applyMatrix4(o.matrixWorld);let c=e.ray.origin.distanceTo(yi);return c<e.near||c>e.far?null:{distance:c,point:yi.clone(),object:o}}function vi(o,t,e,n,i,s,r,l,a,c){o.getVertexPosition(l,mi),o.getVertexPosition(a,gi),o.getVertexPosition(c,_i);let h=ko(o,t,e,n,mi,gi,_i,Ar);if(h){let u=new E;Ye.getBarycoord(Ar,mi,gi,_i,u),i&&(h.uv=Ye.getInterpolatedAttribute(i,l,a,c,u,new At)),s&&(h.uv1=Ye.getInterpolatedAttribute(s,l,a,c,u,new At)),r&&(h.normal=Ye.getInterpolatedAttribute(r,l,a,c,u,new E),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a:l,b:a,c,normal:new E,materialIndex:0};Ye.getNormal(mi,gi,_i,d.normal),h.face=d,h.barycoord=u}return h}var Jn=class extends cn{constructor(t=null,e=1,n=1,i,s,r,l,a,c=Os,h=Os,u,d){super(null,r,l,a,c,h,i,s,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var $n=class o extends me{constructor(t=1,e=1,n=1,i=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:r};let l=this;i=Math.floor(i),s=Math.floor(s),r=Math.floor(r);let a=[],c=[],h=[],u=[],d=0,m=0;x("z","y","x",-1,-1,n,e,t,r,s,0),x("z","y","x",1,-1,n,e,-t,r,s,1),x("x","z","y",1,1,t,n,e,i,r,2),x("x","z","y",1,-1,t,n,-e,i,r,3),x("x","y","z",1,-1,t,e,n,i,s,4),x("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(a),this.setAttribute("position",new te(c,3)),this.setAttribute("normal",new te(h,3)),this.setAttribute("uv",new te(u,2));function x(C,O,V,B,U,D,$,it,et,J,rt){let ot=D/et,ht=$/J,st=D/2,ct=$/2,Mt=it/2,ft=et+1,Ht=J+1,Gt=0,Bt=0,yt=new E;for(let xt=0;xt<Ht;xt++){let bt=xt*ht-ct;for(let Wt=0;Wt<ft;Wt++){let Zt=Wt*ot-st;yt[C]=Zt*B,yt[O]=bt*U,yt[V]=Mt,c.push(yt.x,yt.y,yt.z),yt[C]=0,yt[O]=0,yt[V]=it>0?1:-1,h.push(yt.x,yt.y,yt.z),u.push(Wt/et),u.push(1-xt/J),Gt+=1}}for(let xt=0;xt<J;xt++)for(let bt=0;bt<et;bt++){let Wt=d+bt+ft*xt,Zt=d+bt+ft*(xt+1),Pt=d+(bt+1)+ft*(xt+1),Ut=d+(bt+1)+ft*xt;a.push(Wt,Zt,Ut),a.push(Zt,Pt,Ut),Bt+=6}l.addGroup(m,Bt,rt),m+=Bt,d+=Gt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new o(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Oi=class o extends me{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};let s=[],r=[];l(i),c(n),h(),this.setAttribute("position",new te(s,3)),this.setAttribute("normal",new te(s.slice(),3)),this.setAttribute("uv",new te(r,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function l(B){let U=new E,D=new E,$=new E;for(let it=0;it<e.length;it+=3)m(e[it+0],U),m(e[it+1],D),m(e[it+2],$),a(U,D,$,B)}function a(B,U,D,$){let it=$+1,et=[];for(let J=0;J<=it;J++){et[J]=[];let rt=B.clone().lerp(D,J/it),ot=U.clone().lerp(D,J/it),ht=it-J;for(let st=0;st<=ht;st++)st===0&&J===it?et[J][st]=rt:et[J][st]=rt.clone().lerp(ot,st/ht)}for(let J=0;J<it;J++)for(let rt=0;rt<2*(it-J)-1;rt++){let ot=Math.floor(rt/2);rt%2===0?(d(et[J][ot+1]),d(et[J+1][ot]),d(et[J][ot])):(d(et[J][ot+1]),d(et[J+1][ot+1]),d(et[J+1][ot]))}}function c(B){let U=new E;for(let D=0;D<s.length;D+=3)U.x=s[D+0],U.y=s[D+1],U.z=s[D+2],U.normalize().multiplyScalar(B),s[D+0]=U.x,s[D+1]=U.y,s[D+2]=U.z}function h(){let B=new E;for(let U=0;U<s.length;U+=3){B.x=s[U+0],B.y=s[U+1],B.z=s[U+2];let D=O(B)/2/Math.PI+.5,$=V(B)/Math.PI+.5;r.push(D,1-$)}x(),u()}function u(){for(let B=0;B<r.length;B+=6){let U=r[B+0],D=r[B+2],$=r[B+4],it=Math.max(U,D,$),et=Math.min(U,D,$);it>.9&&et<.1&&(U<.2&&(r[B+0]+=1),D<.2&&(r[B+2]+=1),$<.2&&(r[B+4]+=1))}}function d(B){s.push(B.x,B.y,B.z)}function m(B,U){let D=B*3;U.x=t[D+0],U.y=t[D+1],U.z=t[D+2]}function x(){let B=new E,U=new E,D=new E,$=new E,it=new At,et=new At,J=new At;for(let rt=0,ot=0;rt<s.length;rt+=9,ot+=6){B.set(s[rt+0],s[rt+1],s[rt+2]),U.set(s[rt+3],s[rt+4],s[rt+5]),D.set(s[rt+6],s[rt+7],s[rt+8]),it.set(r[ot+0],r[ot+1]),et.set(r[ot+2],r[ot+3]),J.set(r[ot+4],r[ot+5]),$.copy(B).add(U).add(D).divideScalar(3);let ht=O($);C(it,ot+0,B,ht),C(et,ot+2,U,ht),C(J,ot+4,D,ht)}}function C(B,U,D,$){$<0&&B.x===1&&(r[U]=B.x-1),D.x===0&&D.z===0&&(r[U]=$/2/Math.PI+.5)}function O(B){return Math.atan2(B.z,-B.x)}function V(B){return Math.atan2(-B.y,Math.sqrt(B.x*B.x+B.z*B.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new o(t.vertices,t.indices,t.radius,t.detail)}};function Vo(o,t,e=2){let n=t&&t.length,i=n?t[0]*e:o.length,s=Kr(o,0,i,e,!0),r=[];if(!s||s.next===s.prev)return r;let l,a,c;if(n&&(s=qo(o,t,s,e)),o.length>80*e){l=o[0],a=o[1];let h=l,u=a;for(let d=e;d<i;d+=e){let m=o[d],x=o[d+1];m<l&&(l=m),x<a&&(a=x),m>h&&(h=m),x>u&&(u=x)}c=Math.max(h-l,u-a),c=c!==0?32767/c:0}return Kn(s,r,e,l,a,c,0),r}function Kr(o,t,e,n,i){let s;if(i===ia(o,t,e,n)>0)for(let r=t;r<e;r+=n)s=Rr(r/n|0,o[r],o[r+1],s);else for(let r=e-n;r>=t;r-=n)s=Rr(r/n|0,o[r],o[r+1],s);return s&&In(s,s.next)&&(jn(s),s=s.next),s}function un(o,t){if(!o)return o;t||(t=o);let e=o,n;do if(n=!1,!e.steiner&&(In(e,e.next)||Nt(e.prev,e,e.next)===0)){if(jn(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Kn(o,t,e,n,i,s,r){if(!o)return;!r&&s&&Ko(o,n,i,s);let l=o;for(;o.prev!==o.next;){let a=o.prev,c=o.next;if(s?Go(o,n,i,s):Ho(o)){t.push(a.i,o.i,c.i),jn(o),o=c.next,l=c.next;continue}if(o=c,o===l){r?r===1?(o=Wo(un(o),t),Kn(o,t,e,n,i,s,2)):r===2&&Xo(o,t,e,n,i,s):Kn(un(o),t,e,n,i,s,1);break}}}function Ho(o){let t=o.prev,e=o,n=o.next;if(Nt(t,e,n)>=0)return!1;let i=t.x,s=e.x,r=n.x,l=t.y,a=e.y,c=n.y,h=Math.min(i,s,r),u=Math.min(l,a,c),d=Math.max(i,s,r),m=Math.max(l,a,c),x=n.next;for(;x!==t;){if(x.x>=h&&x.x<=d&&x.y>=u&&x.y<=m&&Hn(i,l,s,a,r,c,x.x,x.y)&&Nt(x.prev,x,x.next)>=0)return!1;x=x.next}return!0}function Go(o,t,e,n){let i=o.prev,s=o,r=o.next;if(Nt(i,s,r)>=0)return!1;let l=i.x,a=s.x,c=r.x,h=i.y,u=s.y,d=r.y,m=Math.min(l,a,c),x=Math.min(h,u,d),C=Math.max(l,a,c),O=Math.max(h,u,d),V=qs(m,x,t,e,n),B=qs(C,O,t,e,n),U=o.prevZ,D=o.nextZ;for(;U&&U.z>=V&&D&&D.z<=B;){if(U.x>=m&&U.x<=C&&U.y>=x&&U.y<=O&&U!==i&&U!==r&&Hn(l,h,a,u,c,d,U.x,U.y)&&Nt(U.prev,U,U.next)>=0||(U=U.prevZ,D.x>=m&&D.x<=C&&D.y>=x&&D.y<=O&&D!==i&&D!==r&&Hn(l,h,a,u,c,d,D.x,D.y)&&Nt(D.prev,D,D.next)>=0))return!1;D=D.nextZ}for(;U&&U.z>=V;){if(U.x>=m&&U.x<=C&&U.y>=x&&U.y<=O&&U!==i&&U!==r&&Hn(l,h,a,u,c,d,U.x,U.y)&&Nt(U.prev,U,U.next)>=0)return!1;U=U.prevZ}for(;D&&D.z<=B;){if(D.x>=m&&D.x<=C&&D.y>=x&&D.y<=O&&D!==i&&D!==r&&Hn(l,h,a,u,c,d,D.x,D.y)&&Nt(D.prev,D,D.next)>=0)return!1;D=D.nextZ}return!0}function Wo(o,t){let e=o;do{let n=e.prev,i=e.next.next;!In(n,i)&&jr(n,e,e.next,i)&&Qn(n,i)&&Qn(i,n)&&(t.push(n.i,e.i,i.i),jn(e),jn(e.next),e=o=i),e=e.next}while(e!==o);return un(e)}function Xo(o,t,e,n,i,s){let r=o;do{let l=r.next.next;for(;l!==r.prev;){if(r.i!==l.i&&ta(r,l)){let a=to(r,l);r=un(r,r.next),a=un(a,a.next),Kn(r,t,e,n,i,s,0),Kn(a,t,e,n,i,s,0);return}l=l.next}r=r.next}while(r!==o)}function qo(o,t,e,n){let i=[];for(let s=0,r=t.length;s<r;s++){let l=t[s]*n,a=s<r-1?t[s+1]*n:o.length,c=Kr(o,l,a,n,!1);c===c.next&&(c.steiner=!0),i.push(jo(c))}i.sort(Yo);for(let s=0;s<i.length;s++)e=Zo(i[s],e);return e}function Yo(o,t){let e=o.x-t.x;if(e===0&&(e=o.y-t.y,e===0)){let n=(o.next.y-o.y)/(o.next.x-o.x),i=(t.next.y-t.y)/(t.next.x-t.x);e=n-i}return e}function Zo(o,t){let e=Jo(o,t);if(!e)return t;let n=to(e,o);return un(n,n.next),un(e,e.next)}function Jo(o,t){let e=t,n=o.x,i=o.y,s=-1/0,r;if(In(o,e))return e;do{if(In(o,e.next))return e.next;if(i<=e.y&&i>=e.next.y&&e.next.y!==e.y){let u=e.x+(i-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(u<=n&&u>s&&(s=u,r=e.x<e.next.x?e:e.next,u===n))return r}e=e.next}while(e!==t);if(!r)return null;let l=r,a=r.x,c=r.y,h=1/0;e=r;do{if(n>=e.x&&e.x>=a&&n!==e.x&&Qr(i<c?n:s,i,a,c,i<c?s:n,i,e.x,e.y)){let u=Math.abs(i-e.y)/(n-e.x);Qn(e,o)&&(u<h||u===h&&(e.x>r.x||e.x===r.x&&$o(r,e)))&&(r=e,h=u)}e=e.next}while(e!==l);return r}function $o(o,t){return Nt(o.prev,o,t.prev)<0&&Nt(t.next,o,o.next)<0}function Ko(o,t,e,n){let i=o;do i.z===0&&(i.z=qs(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==o);i.prevZ.nextZ=null,i.prevZ=null,Qo(i)}function Qo(o){let t,e=1;do{let n=o,i;o=null;let s=null;for(t=0;n;){t++;let r=n,l=0;for(let c=0;c<e&&(l++,r=r.nextZ,!!r);c++);let a=e;for(;l>0||a>0&&r;)l!==0&&(a===0||!r||n.z<=r.z)?(i=n,n=n.nextZ,l--):(i=r,r=r.nextZ,a--),s?s.nextZ=i:o=i,i.prevZ=s,s=i;n=r}s.nextZ=null,e*=2}while(t>1);return o}function qs(o,t,e,n,i){return o=(o-e)*i|0,t=(t-n)*i|0,o=(o|o<<8)&16711935,o=(o|o<<4)&252645135,o=(o|o<<2)&858993459,o=(o|o<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,o|t<<1}function jo(o){let t=o,e=o;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==o);return e}function Qr(o,t,e,n,i,s,r,l){return(i-r)*(t-l)>=(o-r)*(s-l)&&(o-r)*(n-l)>=(e-r)*(t-l)&&(e-r)*(s-l)>=(i-r)*(n-l)}function Hn(o,t,e,n,i,s,r,l){return!(o===r&&t===l)&&Qr(o,t,e,n,i,s,r,l)}function ta(o,t){return o.next.i!==t.i&&o.prev.i!==t.i&&!ea(o,t)&&(Qn(o,t)&&Qn(t,o)&&na(o,t)&&(Nt(o.prev,o,t.prev)||Nt(o,t.prev,t))||In(o,t)&&Nt(o.prev,o,o.next)>0&&Nt(t.prev,t,t.next)>0)}function Nt(o,t,e){return(t.y-o.y)*(e.x-t.x)-(t.x-o.x)*(e.y-t.y)}function In(o,t){return o.x===t.x&&o.y===t.y}function jr(o,t,e,n){let i=bi(Nt(o,t,e)),s=bi(Nt(o,t,n)),r=bi(Nt(e,n,o)),l=bi(Nt(e,n,t));return!!(i!==s&&r!==l||i===0&&Mi(o,e,t)||s===0&&Mi(o,n,t)||r===0&&Mi(e,o,n)||l===0&&Mi(e,t,n))}function Mi(o,t,e){return t.x<=Math.max(o.x,e.x)&&t.x>=Math.min(o.x,e.x)&&t.y<=Math.max(o.y,e.y)&&t.y>=Math.min(o.y,e.y)}function bi(o){return o>0?1:o<0?-1:0}function ea(o,t){let e=o;do{if(e.i!==o.i&&e.next.i!==o.i&&e.i!==t.i&&e.next.i!==t.i&&jr(e,e.next,o,t))return!0;e=e.next}while(e!==o);return!1}function Qn(o,t){return Nt(o.prev,o,o.next)<0?Nt(o,t,o.next)>=0&&Nt(o,o.prev,t)>=0:Nt(o,t,o.prev)<0||Nt(o,o.next,t)<0}function na(o,t){let e=o,n=!1,i=(o.x+t.x)/2,s=(o.y+t.y)/2;do e.y>s!=e.next.y>s&&e.next.y!==e.y&&i<(e.next.x-e.x)*(s-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==o);return n}function to(o,t){let e=Ys(o.i,o.x,o.y),n=Ys(t.i,t.x,t.y),i=o.next,s=t.prev;return o.next=t,t.prev=o,e.next=i,i.prev=e,n.next=e,e.prev=n,s.next=n,n.prev=s,n}function Rr(o,t,e,n){let i=Ys(o,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function jn(o){o.next.prev=o.prev,o.prev.next=o.next,o.prevZ&&(o.prevZ.nextZ=o.nextZ),o.nextZ&&(o.nextZ.prevZ=o.prevZ)}function Ys(o,t,e){return{i:o,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function ia(o,t,e,n){let i=0;for(let s=t,r=e-n;s<e;s+=n)i+=(o[r]-o[s])*(o[s+1]+o[r+1]),r=s;return i}var Zs=class{static triangulate(t,e,n=2){return Vo(t,e,n)}},ti=class o{static area(t){let e=t.length,n=0;for(let i=e-1,s=0;s<e;i=s++)n+=t[i].x*t[s].y-t[s].x*t[i].y;return n*.5}static isClockWise(t){return o.area(t)<0}static triangulateShape(t,e){let n=[],i=[],s=[];Cr(t),Ir(n,t);let r=t.length;e.forEach(Cr);for(let a=0;a<e.length;a++)i.push(r),r+=e[a].length,Ir(n,e[a]);let l=Zs.triangulate(n,i);for(let a=0;a<l.length;a+=3)s.push(l.slice(a,a+3));return s}};function Cr(o){let t=o.length;t>2&&o[t-1].equals(o[0])&&o.pop()}function Ir(o,t){for(let e=0;e<t.length;e++)o.push(t[e].x),o.push(t[e].y)}var ei=class o extends Oi{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new o(t.radius,t.detail)}};function eo(o){let t={};for(let e in o){t[e]={};for(let n in o[e]){let i=o[e][n];if(Pr(i))i.isRenderTargetTexture?(Vt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(Pr(i[0])){let s=[];for(let r=0,l=i.length;r<l;r++)s[r]=i[r].clone();t[e][n]=s}else t[e][n]=i.slice();else t[e][n]=i}}return t}function ee(o){let t={};for(let e=0;e<o.length;e++){let n=eo(o[e]);for(let i in n)t[i]=n[i]}return t}function Pr(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}var Bi=class extends Yn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new mt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new mt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=qr,this.normalScale=new At(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},ni=class extends Bi{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new At(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return pt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new mt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new mt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new mt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};function Tn(o,t){return!o||o.constructor===t?o:typeof t.BYTES_PER_ELEMENT=="number"?new t(o):Array.prototype.slice.call(o)}function Rs(o){return o!==void 0&&o.inTangents!==void 0&&o.outTangents!==void 0}var $e=class{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,i=e[n],s=e[n-1];n:{t:{let r;e:{i:if(!(t<i)){for(let l=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===l)break;if(s=i,i=e[++n],t<i)break t}r=e.length;break e}if(!(t>=s)){let l=e[1];t<l&&(n=2,s=l);for(let a=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=s,s=e[--n-1],t>=s)break t}r=n,n=0;break e}break n}for(;n<r;){let l=n+r>>>1;t<e[l]?r=l:n=l+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let r=0;r!==i;++r)e[r]=n[s+r];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},zi=class extends $e{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:zs,endingEnd:zs}}intervalChanged_(t,e,n){let i=this.parameterPositions,s=t-2,r=t+1,l=i[s],a=i[r];if(l===void 0)switch(this.getSettings_().endingStart){case ks:s=t,l=2*e-n;break;case Vs:s=i.length-2,l=e+i[s]-i[s+1];break;default:s=t,l=n}if(a===void 0)switch(this.getSettings_().endingEnd){case ks:r=t,a=2*n-e;break;case Vs:r=1,a=n+i[1]-i[0];break;default:r=t-1,a=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-l),this._weightNext=c/(a-n),this._offsetPrev=s*h,this._offsetNext=r*h}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=t*l,c=a-l,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,m=this._weightNext,x=(n-e)/(i-e),C=x*x,O=C*x,V=-d*O+2*d*C-d*x,B=(1+d)*O+(-1.5-2*d)*C+(-.5+d)*x+1,U=(-1-m)*O+(1.5+m)*C+.5*x,D=m*O-m*C;for(let $=0;$!==l;++$)s[$]=V*r[h+$]+B*r[c+$]+U*r[a+$]+D*r[u+$];return s}},ki=class extends $e{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=t*l,c=a-l,h=(n-e)/(i-e),u=1-h;for(let d=0;d!==l;++d)s[d]=r[c+d]*u+r[a+d]*h;return s}},Vi=class extends $e{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}},Hi=class extends $e{interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=t*l,c=a-l,h=this.inTangents,u=this.outTangents;if(!h||!u){let x=(n-e)/(i-e),C=1-x;for(let O=0;O!==l;++O)s[O]=r[c+O]*C+r[a+O]*x;return s}let d=l*2,m=t-1;for(let x=0;x!==l;++x){let C=r[c+x],O=r[a+x],V=m*d+x*2,B=u[V],U=u[V+1],D=t*d+x*2,$=h[D],it=h[D+1],et=ra(n,e,B,$,i);s[x]=no(et,C,U,it,O)}return s}};function no(o,t,e,n,i){let s=1-o;return s*s*s*t+3*s*s*o*e+3*s*o*o*n+o*o*o*i}function sa(o,t,e,n,i){let s=1-o;return 3*s*s*(e-t)+6*s*o*(n-e)+3*o*o*(i-n)}function ra(o,t,e,n,i){let s=(o-t)/(i-t);for(let r=0;r<8;r++){let l=no(s,t,e,n,i)-o;if(Math.abs(l)<1e-10)break;let a=sa(s,t,e,n,i);if(Math.abs(a)<1e-10)break;s=Math.max(0,Math.min(1,s-l/a))}return s}var ge=class{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Tn(e,this.TimeBufferType),this.values=Tn(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Tn(t.times,Array),values:Tn(t.values,Array)};let i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i),Rs(t.settings)&&(n.settings={inTangents:Tn(t.settings.inTangents,Array),outTangents:Tn(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Vi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ki(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new zi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Hi(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Wn:e=this.InterpolantFactoryMethodDiscrete;break;case Ai:e=this.InterpolantFactoryMethodLinear;break;case Si:e=this.InterpolantFactoryMethodSmooth;break;case Bs:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Vt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Wn;case this.InterpolantFactoryMethodLinear:return Ai;case this.InterpolantFactoryMethodSmooth:return Si;case this.InterpolantFactoryMethodBezier:return Bs}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t;Rs(this.settings)&&(Lr(this.settings.inTangents,t),Lr(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,i=n.length,s=0,r=i-1;for(;s!==i&&n[s]<t;)++s;for(;r!==-1&&n[r]>e;)--r;if(++r,s!==0||r!==i){s>=r&&(r=Math.max(r,1),s=r-1);let l=this.getValueSize();this.times=n.slice(s,r),this.values=this.values.slice(s*l,r*l)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Dt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,i=this.values,s=n.length;s===0&&(Dt("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let l=0;l!==s;l++){let a=n[l];if(typeof a=="number"&&isNaN(a)){Dt("KeyframeTrack: Time is not a valid number.",this,l,a),t=!1;break}if(r!==null&&r>a){Dt("KeyframeTrack: Out of order keys.",this,l,a,r),t=!1;break}r=a}if(i!==void 0&&Mo(i))for(let l=0,a=i.length;l!==a;++l){let c=i[l];if(isNaN(c)){Dt("KeyframeTrack: Value is not a valid number.",this,l,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Si,s=t.length-1,r=1;for(let l=1;l<s;++l){let a=!1,c=t[l],h=t[l+1];if(c!==h&&(l!==1||c!==t[0]))if(i)a=!0;else{let u=l*n,d=u-n,m=u+n;for(let x=0;x!==n;++x){let C=e[u+x];if(C!==e[d+x]||C!==e[m+x]){a=!0;break}}}if(a){if(l!==r){t[r]=t[l];let u=l*n,d=r*n;for(let m=0;m!==n;++m)e[d+m]=e[u+m]}++r}}if(s>0){t[r]=t[s];for(let l=s*n,a=r*n,c=0;c!==n;++c)e[a+c]=e[l+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=e.slice(0,r*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,Rs(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function Lr(o,t){for(let e=0,n=o.length;e!==n;e+=2)o[e]*=t}ge.prototype.ValueTypeName="";ge.prototype.TimeBufferType=Float32Array;ge.prototype.ValueBufferType=Float32Array;ge.prototype.DefaultInterpolation=Ai;var Ke=class extends ge{constructor(t,e,n){super(t,e,n)}};Ke.prototype.ValueTypeName="bool";Ke.prototype.ValueBufferType=Array;Ke.prototype.DefaultInterpolation=Wn;Ke.prototype.InterpolantFactoryMethodLinear=void 0;Ke.prototype.InterpolantFactoryMethodSmooth=void 0;var Gi=class extends ge{constructor(t,e,n,i){super(t,e,n,i)}};Gi.prototype.ValueTypeName="color";var Wi=class extends ge{constructor(t,e,n,i){super(t,e,n,i)}};Wi.prototype.ValueTypeName="number";var Xi=class extends $e{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=(n-e)/(i-e),c=t*l;for(let h=c+l;c!==h;c+=4)Ue.slerpFlat(s,0,r,c-l,r,c,a);return s}},ii=class extends ge{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new Xi(this.times,this.values,this.getValueSize(),t)}};ii.prototype.ValueTypeName="quaternion";ii.prototype.InterpolantFactoryMethodSmooth=void 0;var Qe=class extends ge{constructor(t,e,n){super(t,e,n)}};Qe.prototype.ValueTypeName="string";Qe.prototype.ValueBufferType=Array;Qe.prototype.DefaultInterpolation=Wn;Qe.prototype.InterpolantFactoryMethodLinear=void 0;Qe.prototype.InterpolantFactoryMethodSmooth=void 0;var qi=class extends ge{constructor(t,e,n,i){super(t,e,n,i)}};qi.prototype.ValueTypeName="vector";var Yi=class{constructor(t,e,n){let i=this,s=!1,r=0,l=0,a,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){l++,s===!1&&i.onStart!==void 0&&i.onStart(h,r,l),s=!0},this.itemEnd=function(h){r++,i.onProgress!==void 0&&i.onProgress(h,r,l),r===l&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),a?a(h):h},this.setURLModifier=function(h){return a=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let m=c[u],x=c[u+1];if(m.global&&(m.lastIndex=0),m.test(h))return x}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},io=new Yi,Zi=class{constructor(t){this.manager=t!==void 0?t:io,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Zi.DEFAULT_MATERIAL_NAME="__DEFAULT";var cr="\\[\\]\\.:\\/",oa=new RegExp("["+cr+"]","g"),hr="[^"+cr+"]",aa="[^"+cr.replace("\\.","")+"]",la=/((?:WC+[\/:])*)/.source.replace("WC",hr),ca=/(WCOD+)?/.source.replace("WCOD",aa),ha=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",hr),ua=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",hr),fa=new RegExp("^"+la+ca+ha+ua+"$"),da=["material","materials","bones","map"],Js=class{constructor(t,e,n){let i=n||It.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},It=class o{constructor(t,e,n){this.path=e,this.parsedPath=n||o.parseTrackName(e),this.node=o.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new o.Composite(t,e,n):new o(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(oa,"")}static parseTrackName(t){let e=fa.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);da.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(s){for(let r=0;r<s.length;r++){let l=s[r];if(l.name===e||l.uuid===e)return l;let a=n(l.children);if(a)return a}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,i=e.propertyName,s=e.propertyIndex;if(t||(t=o.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Vt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Dt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Dt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Dt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Dt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Dt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Dt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Dt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[i];if(r===void 0){let c=e.nodeName;Dt("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",t);return}let l=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?l=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(l=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){Dt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Dt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}a=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=s}else r.fromArray!==void 0&&r.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(a=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][l]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};It.Composite=Js;It.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};It.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};It.prototype.GetterByBindingType=[It.prototype._getValue_direct,It.prototype._getValue_array,It.prototype._getValue_arrayElement,It.prototype._getValue_toArray];It.prototype.SetterByBindingTypeAndVersioning=[[It.prototype._setValue_direct,It.prototype._setValue_direct_setNeedsUpdate,It.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[It.prototype._setValue_array,It.prototype._setValue_array_setNeedsUpdate,It.prototype._setValue_array_setMatrixWorldNeedsUpdate],[It.prototype._setValue_arrayElement,It.prototype._setValue_arrayElement_setNeedsUpdate,It.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[It.prototype._setValue_fromArray,It.prototype._setValue_fromArray_setNeedsUpdate,It.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var dh=new Float32Array(1);var $s=class o{static{o.prototype.isMatrix2=!0}constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){let s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=i,this}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Vt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");var va=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ma=`#ifdef USE_ALPHAHASH
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
#endif`,ba=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Sa=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wa=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ea=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ta=`#ifdef USE_AOMAP
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
#endif`,Aa=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ra=`#ifdef USE_BATCHING
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
#endif`,Ca=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ia=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Pa=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,La=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Da=`#ifdef USE_IRIDESCENCE
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
#endif`,Na=`#ifdef USE_BUMPMAP
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
#endif`,Ua=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Fa=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Oa=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ba=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,za=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ka=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Va=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Ha=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Ga=`#define PI 3.141592653589793
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
} // validated`,Wa=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Xa=`vec3 transformedNormal = objectNormal;
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
#endif`,qa=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ya=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Za=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ja=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,$a="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ka=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Qa=`#ifdef USE_ENVMAP
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
#endif`,ja=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,tl=`#ifdef USE_ENVMAP
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
#endif`,el=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,nl=`#ifdef USE_ENVMAP
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
#endif`,il=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,sl=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,rl=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ol=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,al=`#ifdef USE_GRADIENTMAP
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
}`,ll=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,cl=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,hl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ul=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,fl=`#ifdef USE_ENVMAP
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
#endif`,dl=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,pl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ml=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,gl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,_l=`PhysicalMaterial material;
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
#endif`,xl=`uniform sampler2D dfgLUT;
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
}`,yl=`
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
#endif`,vl=`#if defined( RE_IndirectDiffuse )
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
#endif`,Ml=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,bl=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,Sl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,wl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,El=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Tl=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Al=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Rl=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Cl=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Il=`#if defined( USE_POINTS_UV )
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
#endif`,Pl=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ll=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Dl=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Nl=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ul=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Fl=`#ifdef USE_MORPHTARGETS
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
#endif`,Ol=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Bl=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,zl=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,kl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hl=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Gl=`#ifdef USE_NORMALMAP
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
#endif`,Wl=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Xl=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ql=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Yl=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Zl=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Jl=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,$l=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Kl=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Ql=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,jl=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,tc=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ec=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,nc=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,ic=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,sc=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,rc=`float getShadowMask() {
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
}`,oc=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ac=`#ifdef USE_SKINNING
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
#endif`,lc=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,cc=`#ifdef USE_SKINNING
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
#endif`,hc=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,uc=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,fc=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,dc=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,pc=`#ifdef USE_TRANSMISSION
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
#endif`,mc=`#ifdef USE_TRANSMISSION
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
#endif`,gc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,_c=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,xc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,yc=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,vc=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Mc=`uniform sampler2D t2D;
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
}`,bc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Sc=`#ifdef ENVMAP_TYPE_CUBE
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
}`,wc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ec=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tc=`#include <common>
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
}`,Ac=`#if DEPTH_PACKING == 3200
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
}`,Rc=`#define DISTANCE
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
}`,Cc=`#define DISTANCE
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
}`,Ic=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Pc=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lc=`uniform float scale;
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
}`,Dc=`uniform vec3 diffuse;
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
}`,Nc=`#include <common>
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
}`,Uc=`uniform vec3 diffuse;
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
}`,Fc=`#define LAMBERT
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
}`,Oc=`#define LAMBERT
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
}`,Bc=`#define MATCAP
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
}`,zc=`#define MATCAP
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
}`,kc=`#define NORMAL
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
}`,Vc=`#define NORMAL
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
}`,Hc=`#define PHONG
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
}`,Gc=`#define PHONG
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
}`,Wc=`#define STANDARD
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
}`,Xc=`#define STANDARD
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
}`,qc=`#define TOON
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
}`,Yc=`#define TOON
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
}`,Zc=`uniform float size;
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
}`,Jc=`uniform vec3 diffuse;
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
}`,$c=`#include <common>
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
}`,Kc=`uniform vec3 color;
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
}`,Qc=`uniform float rotation;
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
}`,jc=`uniform vec3 diffuse;
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
}`,gt={alphahash_fragment:va,alphahash_pars_fragment:Ma,alphamap_fragment:ba,alphamap_pars_fragment:Sa,alphatest_fragment:wa,alphatest_pars_fragment:Ea,aomap_fragment:Ta,aomap_pars_fragment:Aa,batching_pars_vertex:Ra,batching_vertex:Ca,begin_vertex:Ia,beginnormal_vertex:Pa,bsdfs:La,iridescence_fragment:Da,bumpmap_pars_fragment:Na,clipping_planes_fragment:Ua,clipping_planes_pars_fragment:Fa,clipping_planes_pars_vertex:Oa,clipping_planes_vertex:Ba,color_fragment:za,color_pars_fragment:ka,color_pars_vertex:Va,color_vertex:Ha,common:Ga,cube_uv_reflection_fragment:Wa,defaultnormal_vertex:Xa,displacementmap_pars_vertex:qa,displacementmap_vertex:Ya,emissivemap_fragment:Za,emissivemap_pars_fragment:Ja,colorspace_fragment:$a,colorspace_pars_fragment:Ka,envmap_fragment:Qa,envmap_common_pars_fragment:ja,envmap_pars_fragment:tl,envmap_pars_vertex:el,envmap_physical_pars_fragment:fl,envmap_vertex:nl,fog_vertex:il,fog_pars_vertex:sl,fog_fragment:rl,fog_pars_fragment:ol,gradientmap_pars_fragment:al,lightmap_pars_fragment:ll,lights_lambert_fragment:cl,lights_lambert_pars_fragment:hl,lights_pars_begin:ul,lights_toon_fragment:dl,lights_toon_pars_fragment:pl,lights_phong_fragment:ml,lights_phong_pars_fragment:gl,lights_physical_fragment:_l,lights_physical_pars_fragment:xl,lights_fragment_begin:yl,lights_fragment_maps:vl,lights_fragment_end:Ml,lightprobes_pars_fragment:bl,logdepthbuf_fragment:Sl,logdepthbuf_pars_fragment:wl,logdepthbuf_pars_vertex:El,logdepthbuf_vertex:Tl,map_fragment:Al,map_pars_fragment:Rl,map_particle_fragment:Cl,map_particle_pars_fragment:Il,metalnessmap_fragment:Pl,metalnessmap_pars_fragment:Ll,morphinstance_vertex:Dl,morphcolor_vertex:Nl,morphnormal_vertex:Ul,morphtarget_pars_vertex:Fl,morphtarget_vertex:Ol,normal_fragment_begin:Bl,normal_fragment_maps:zl,normal_pars_fragment:kl,normal_pars_vertex:Vl,normal_vertex:Hl,normalmap_pars_fragment:Gl,clearcoat_normal_fragment_begin:Wl,clearcoat_normal_fragment_maps:Xl,clearcoat_pars_fragment:ql,iridescence_pars_fragment:Yl,opaque_fragment:Zl,packing:Jl,premultiplied_alpha_fragment:$l,project_vertex:Kl,dithering_fragment:Ql,dithering_pars_fragment:jl,roughnessmap_fragment:tc,roughnessmap_pars_fragment:ec,shadowmap_pars_fragment:nc,shadowmap_pars_vertex:ic,shadowmap_vertex:sc,shadowmask_pars_fragment:rc,skinbase_vertex:oc,skinning_pars_vertex:ac,skinning_vertex:lc,skinnormal_vertex:cc,specularmap_fragment:hc,specularmap_pars_fragment:uc,tonemapping_fragment:fc,tonemapping_pars_fragment:dc,transmission_fragment:pc,transmission_pars_fragment:mc,uv_pars_fragment:gc,uv_pars_vertex:_c,uv_vertex:xc,worldpos_vertex:yc,background_vert:vc,background_frag:Mc,backgroundCube_vert:bc,backgroundCube_frag:Sc,cube_vert:wc,cube_frag:Ec,depth_vert:Tc,depth_frag:Ac,distance_vert:Rc,distance_frag:Cc,equirect_vert:Ic,equirect_frag:Pc,linedashed_vert:Lc,linedashed_frag:Dc,meshbasic_vert:Nc,meshbasic_frag:Uc,meshlambert_vert:Fc,meshlambert_frag:Oc,meshmatcap_vert:Bc,meshmatcap_frag:zc,meshnormal_vert:kc,meshnormal_frag:Vc,meshphong_vert:Hc,meshphong_frag:Gc,meshphysical_vert:Wc,meshphysical_frag:Xc,meshtoon_vert:qc,meshtoon_frag:Yc,points_vert:Zc,points_frag:Jc,shadow_vert:$c,shadow_frag:Kc,sprite_vert:Qc,sprite_frag:jc},tt={common:{diffuse:{value:new mt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ut},alphaMap:{value:null},alphaMapTransform:{value:new ut},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ut}},envmap:{envMap:{value:null},envMapRotation:{value:new ut},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ut}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ut}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ut},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ut},normalScale:{value:new At(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ut},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ut}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ut}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ut}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new mt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new E},probesMax:{value:new E},probesResolution:{value:new E}},points:{diffuse:{value:new mt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ut},alphaTest:{value:0},uvTransform:{value:new ut}},sprite:{diffuse:{value:new mt(16777215)},opacity:{value:1},center:{value:new At(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ut},alphaMap:{value:null},alphaMapTransform:{value:new ut},alphaTest:{value:0}}},so={basic:{uniforms:ee([tt.common,tt.specularmap,tt.envmap,tt.aomap,tt.lightmap,tt.fog]),vertexShader:gt.meshbasic_vert,fragmentShader:gt.meshbasic_frag},lambert:{uniforms:ee([tt.common,tt.specularmap,tt.envmap,tt.aomap,tt.lightmap,tt.emissivemap,tt.bumpmap,tt.normalmap,tt.displacementmap,tt.fog,tt.lights,{emissive:{value:new mt(0)},envMapIntensity:{value:1}}]),vertexShader:gt.meshlambert_vert,fragmentShader:gt.meshlambert_frag},phong:{uniforms:ee([tt.common,tt.specularmap,tt.envmap,tt.aomap,tt.lightmap,tt.emissivemap,tt.bumpmap,tt.normalmap,tt.displacementmap,tt.fog,tt.lights,{emissive:{value:new mt(0)},specular:{value:new mt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:gt.meshphong_vert,fragmentShader:gt.meshphong_frag},standard:{uniforms:ee([tt.common,tt.envmap,tt.aomap,tt.lightmap,tt.emissivemap,tt.bumpmap,tt.normalmap,tt.displacementmap,tt.roughnessmap,tt.metalnessmap,tt.fog,tt.lights,{emissive:{value:new mt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:gt.meshphysical_vert,fragmentShader:gt.meshphysical_frag},toon:{uniforms:ee([tt.common,tt.aomap,tt.lightmap,tt.emissivemap,tt.bumpmap,tt.normalmap,tt.displacementmap,tt.gradientmap,tt.fog,tt.lights,{emissive:{value:new mt(0)}}]),vertexShader:gt.meshtoon_vert,fragmentShader:gt.meshtoon_frag},matcap:{uniforms:ee([tt.common,tt.bumpmap,tt.normalmap,tt.displacementmap,tt.fog,{matcap:{value:null}}]),vertexShader:gt.meshmatcap_vert,fragmentShader:gt.meshmatcap_frag},points:{uniforms:ee([tt.points,tt.fog]),vertexShader:gt.points_vert,fragmentShader:gt.points_frag},dashed:{uniforms:ee([tt.common,tt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:gt.linedashed_vert,fragmentShader:gt.linedashed_frag},depth:{uniforms:ee([tt.common,tt.displacementmap]),vertexShader:gt.depth_vert,fragmentShader:gt.depth_frag},normal:{uniforms:ee([tt.common,tt.bumpmap,tt.normalmap,tt.displacementmap,{opacity:{value:1}}]),vertexShader:gt.meshnormal_vert,fragmentShader:gt.meshnormal_frag},sprite:{uniforms:ee([tt.sprite,tt.fog]),vertexShader:gt.sprite_vert,fragmentShader:gt.sprite_frag},background:{uniforms:{uvTransform:{value:new ut},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:gt.background_vert,fragmentShader:gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ut}},vertexShader:gt.backgroundCube_vert,fragmentShader:gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:gt.cube_vert,fragmentShader:gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:gt.equirect_vert,fragmentShader:gt.equirect_frag},distance:{uniforms:ee([tt.common,tt.displacementmap,{referencePosition:{value:new E},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:gt.distance_vert,fragmentShader:gt.distance_frag},shadow:{uniforms:ee([tt.lights,tt.fog,{color:{value:new mt(0)},opacity:{value:1}}]),vertexShader:gt.shadow_vert,fragmentShader:gt.shadow_frag}};so.physical={uniforms:ee([so.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ut},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ut},clearcoatNormalScale:{value:new At(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ut},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ut},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ut},sheen:{value:0},sheenColor:{value:new mt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ut},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ut},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ut},transmissionSamplerSize:{value:new At},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ut},attenuationDistance:{value:0},attenuationColor:{value:new mt(0)},specularColor:{value:new mt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ut},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ut},anisotropyVector:{value:new At},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ut}}]),vertexShader:gt.meshphysical_vert,fragmentShader:gt.meshphysical_frag};var th=new ut;th.set(-1,0,0,0,1,0,0,0,1);var ug={[js]:"LINEAR_TONE_MAPPING",[tr]:"REINHARD_TONE_MAPPING",[er]:"CINEON_TONE_MAPPING",[nr]:"ACES_FILMIC_TONE_MAPPING",[sr]:"AGX_TONE_MAPPING",[rr]:"NEUTRAL_TONE_MAPPING",[ir]:"CUSTOM_TONE_MAPPING"};var fg=new Float32Array(16),dg=new Float32Array(9),pg=new Float32Array(4);var mg={[js]:"Linear",[tr]:"Reinhard",[er]:"Cineon",[nr]:"ACESFilmic",[sr]:"AgX",[rr]:"Neutral",[ir]:"Custom"};var gg={[Dr]:"SHADOWMAP_TYPE_PCF",[Nr]:"SHADOWMAP_TYPE_VSM"};var _g={[Hr]:"ENVMAP_TYPE_CUBE",[ar]:"ENVMAP_TYPE_CUBE",[Gr]:"ENVMAP_TYPE_CUBE_UV"};var xg={[ar]:"ENVMAP_MODE_REFRACTION"};var yg={[Qs]:"ENVMAP_BLENDING_MULTIPLY",[kr]:"ENVMAP_BLENDING_MIX",[Vr]:"ENVMAP_BLENDING_ADD"};var eh=new ut;eh.set(-1,0,0,0,1,0,0,0,1);var vg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);function oo(o,t=!1){let e=o[0].index!==null,n=new Set(Object.keys(o[0].attributes)),i=new Set(Object.keys(o[0].morphAttributes)),s={},r={},l=o[0].morphTargetsRelative,a=new me,c=0;for(let h=0;h<o.length;++h){let u=o[h],d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let m in u.attributes){if(!n.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+m+'" attribute exists among all geometries, or in none of them.'),null;s[m]===void 0&&(s[m]=[]),s[m].push(u.attributes[m]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(l!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let m in u.morphAttributes){if(!i.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;r[m]===void 0&&(r[m]=[]),r[m].push(u.morphAttributes[m])}if(t){let m;if(e)m=u.index.count;else if(u.attributes.position!==void 0)m=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;a.addGroup(c,m,h),c+=m}}if(e){let h=0,u=[];for(let d=0;d<o.length;++d){let m=o[d].index;for(let x=0;x<m.count;++x)u.push(m.getX(x)+h);h+=o[d].attributes.position.count}a.setIndex(u)}for(let h in s){let u=ro(s[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;a.setAttribute(h,u)}for(let h in r){let u=r[h][0].length;if(u!==0){a.morphAttributes=a.morphAttributes||{},a.morphAttributes[h]=[];for(let d=0;d<u;++d){let m=[];for(let C=0;C<r[h].length;++C)m.push(r[h][C][d]);let x=ro(m);if(!x)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;a.morphAttributes[h].push(x)}}}return a}function ro(o){let t,e,n,i=-1,s=0;for(let c=0;c<o.length;++c){let h=o[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*e}let r=new t(s),l=new Ft(r,e,n),a=0;for(let c=0;c<o.length;++c){let h=o[c];if(h.isInterleavedBufferAttribute){let u=a/e;for(let d=0,m=h.count;d<m;d++)for(let x=0;x<e;x++){let C=h.getComponent(d,x);l.setComponent(d+u,x,C)}}else r.set(h.array,a);a+=h.count*e}return i!==void 0&&(l.gpuType=i),l}var ih=(()=>{let o={intensity:1,hemi:.12,exposure:1},t={wood:{describe:"timber with visible grain: oak, walnut, pine, plywood, bamboo; bark on a living or fallen tree; the cut end of a log or board",roughness:[.4,.62],metalness:0,tile:.6,size:1024,normal:.4,relief:.4,finishes:{oiled:{roughness:[.4,.62],clearcoat:.18,clearcoatRoughness:.45},lacquered:{roughness:[.3,.45],clearcoat:1,clearcoatRoughness:.08},raw:{roughness:[.66,.86]},bark:{roughness:[.8,.97],pattern:!0,normal:1.1,relief:.9,size:512},endgrain:{roughness:[.62,.82],pattern:!0,normal:.5,relief:.6,tile:.4,size:512}}},metal:{describe:"bare metal: brass, steel, iron, aluminium, copper, chrome",roughness:[.3,.42],metalness:1,tile:.25,size:512,normal:.18,finishes:{brushed:{roughness:[.28,.4],anisotropy:.85},polished:{roughness:[.08,.16]},satin:{roughness:[.42,.55],anisotropy:.3},cast:{roughness:[.55,.75]},rusted:{roughness:[.75,.95],metalness:.35}}},fabric:{describe:"woven or knitted cloth: upholstery, clothing, rugs, curtains, canvas, rope",roughness:[.86,.98],metalness:0,tile:.12,size:512,normal:.5,finishes:{linen:{roughness:[.86,.98],sheen:.45,sheenRoughness:.75},wool:{roughness:[.9,1],sheen:.7,sheenRoughness:.85},velvet:{roughness:[.94,1],sheen:1,sheenRoughness:.5},cotton:{roughness:[.86,.98],sheen:.35,sheenRoughness:.8},denim:{roughness:[.84,.96],sheen:.3,sheenRoughness:.8},canvas:{roughness:[.88,1],sheen:.2,sheenRoughness:.9},knit:{roughness:[.9,1],sheen:.7,sheenRoughness:.85}}},paint:{describe:"an opaque painted or plastered surface over anything: painted wood or metal, walls, lacquer",roughness:[.42,.58],metalness:0,tile:.6,size:256,normal:.3,relief:.3,finishes:{matte:{roughness:[.58,.74]},eggshell:{roughness:[.42,.58]},gloss:{roughness:[.12,.22],clearcoat:.6,clearcoatRoughness:.1}}},ceramic:{describe:"fired clay and porcelain: tiles, crockery, sanitaryware, glazed pots",roughness:[.16,.28],metalness:0,tile:.5,size:256,normal:.12,finishes:{glazed:{roughness:[.14,.24],clearcoat:.8,clearcoatRoughness:.06},matte:{roughness:[.5,.64]}}},leather:{describe:"leather, hide without hair, and bare animal skin such as a nose or paw pad",roughness:[.46,.64],metalness:0,tile:.25,size:512,normal:.7,finishes:{grain:{roughness:[.46,.64],sheen:.15,sheenRoughness:.6},patent:{roughness:[.1,.2],clearcoat:1,clearcoatRoughness:.05,relief:.12}}},rubber:{describe:"rubber and soft matte polymers: tyres, soles, gaskets, grips",roughness:[.7,.86],metalness:0,tile:.2,size:256,normal:.3,finishes:{black:{roughness:[.7,.86]}}},fur:{describe:"the coat of an animal: fur, hair, mane, feathers",roughness:[.7,.92],metalness:0,tile:.16,size:512,normal:.7,body:1.45,bodyClamp:[.18,1.35],finishes:{short:{roughness:[.72,.92],sheen:.6,sheenRoughness:.6},long:{roughness:[.68,.9],sheen:.8,sheenRoughness:.5},plush:{roughness:[.85,1],sheen:1,sheenRoughness:.8},sculpted:{roughness:[.55,.74],relief:.2,sheen:.45,sheenRoughness:.45,sheenWhite:.12}}},keratin:{describe:"hoof, claw, horn, beak, shell, bone, tooth",roughness:[.3,.48],metalness:0,tile:.1,size:256,normal:.25,finishes:{natural:{roughness:[.3,.48],clearcoat:.35,clearcoatRoughness:.3},polished:{roughness:[.12,.22],clearcoat:.9,clearcoatRoughness:.08}}},stone:{describe:"stone, rock, concrete, brick, plaster left rough, slate, marble",roughness:[.78,.96],metalness:0,tile:.45,size:512,normal:.85,finishes:{rough:{roughness:[.8,.97]},concrete:{roughness:[.7,.9]},polished:{roughness:[.12,.28],clearcoat:.5,clearcoatRoughness:.15}}},snow:{describe:"snow, frost, ice crust",roughness:[.8,1],metalness:0,tile:.35,size:256,normal:.45,finishes:{powder:{roughness:[.85,1],sheen:.5,sheenRoughness:.9},ice:{roughness:[.08,.2],clearcoat:.8,clearcoatRoughness:.1}}},foliage:{describe:"living plant matter: leaves, petals, grass, moss, stems, fruit skin; and the CUT-OUT finishes a card wears (spray, needles, grass)",roughness:[.45,.72],metalness:0,tile:.1,size:256,normal:.4,finishes:{leaf:{roughness:[.42,.68],sheen:.25,sheenRoughness:.5},petal:{roughness:[.55,.8],sheen:.5,sheenRoughness:.7},moss:{roughness:[.85,1],sheen:.6,sheenRoughness:.9},spray:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},needles:{roughness:[.72,.94],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},grass:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},core:{roughness:[.92,1],specular:.05,glance:.08,pattern:!0,size:256,tile:.3,normal:.5,crease:80,twoSided:!0}}},soil:{describe:"loose ground: soil, dirt, sand, gravel, mud, ash",roughness:[.88,1],metalness:0,tile:.3,size:512,normal:.9,finishes:{dry:{roughness:[.9,1]},wet:{roughness:[.35,.6]},sand:{roughness:[.85,.98]}}},glass:{describe:"glass and glossy screens, kept SOLID and tinted (never see-through): windows, bottles, lenses, monitor faces",roughness:[.03,.09],metalness:0,tile:.6,size:128,normal:.05,finishes:{clear:{roughness:[.03,.08],clearcoat:1,clearcoatRoughness:.03},frosted:{roughness:[.35,.55]}}},plastic:{describe:"moulded plastic, resin, vinyl, bakelite, acrylic",roughness:[.32,.5],metalness:0,tile:.4,size:256,normal:.15,relief:.3,finishes:{satin:{roughness:[.32,.5]},matte:{roughness:[.55,.72]},gloss:{roughness:[.06,.16],clearcoat:.6,clearcoatRoughness:.08},translucent:{roughness:[.03,.09],clearcoat:1,clearcoatRoughness:.04,transmission:.6,thickness:.012,ior:1.54}}},emissive:{describe:"something that GIVES light: flame, lamp shade when lit, bulb, screen glow, embers, neon",roughness:[.5,.7],metalness:0,tile:.4,size:128,normal:.05,finishes:{glow:{roughness:[.5,.7],emissive:1.4},flame:{roughness:[.6,.8],emissive:2.6,fire:!0,crease:80},screen:{roughness:[.1,.2],emissive:.9,clearcoat:.8,clearcoatRoughness:.05}}},skin:{describe:"bare skin: human skin (natural; soft for a stylised HD face), and the smooth wet skin of sharks, dolphins, whales, fish, eels, frogs and other water animals (wet)",roughness:[.48,.66],metalness:0,tile:.08,size:256,normal:.3,finishes:{natural:{roughness:[.48,.66],sheen:.25,sheenRoughness:.5},wet:{roughness:[.26,.4],relief:.12,clearcoat:.35,clearcoatRoughness:.3},soft:{roughness:[.5,.62],relief:.08,sheen:.18,sheenRoughness:.6}}},paper:{describe:"paper, card, books, cardboard, parchment",roughness:[.82,.96],metalness:0,tile:.2,size:256,normal:.35,relief:.5,finishes:{plain:{roughness:[.82,.96]},glossy:{roughness:[.25,.4]}}}},e=["kind","finish","describe","grain","crease","blend","intensity","must"],n={floor:750,perM2:2e3,exponent:.85,cap:5e4,overFlat:15};function i(f,p=null,g=null){let _=Math.max(0,Number(f?.x)||0),y=Math.max(0,Number(f?.y)||0),b=Math.max(0,Number(f?.z)||0),A=_*y+y*b+_*b,w=Number(g)>0?Math.min(A,Number(g)):A,v=Math.min(n.cap,n.floor+n.perM2*Math.pow(w,n.exponent));return Number(p)>0&&(v=Math.max(n.floor,Math.min(v,n.overFlat*Number(p)))),Math.round(v)}function s(f,p,g){let _=f*374761393+p*668265263+g*1442695041|0;return _=Math.imul(_^_>>>13,1274126177),_^=_>>>16,(_>>>0)/4294967296}let r=f=>f*f*(3-2*f);function l(f,p,g,_,y){let b=Math.floor(f),A=Math.floor(p),w=r(f-b),v=r(p-A),T=(b%g+g)%g,S=(A%_+_)%_,R=(T+1)%g,I=(S+1)%_,P=s(T,S,y),k=s(R,S,y),F=s(T,I,y),Z=s(R,I,y);return P+(k-P)*w+(F+(Z-F)*w-(P+(k-P)*w))*v}function a(f,p,g,_,y,b=4){let A=0,w=.5,v=0,T=g,S=_;for(let R=0;R<b;R++)A+=w*l(f*T,p*S,T,S,y+R*101),v+=w,w*=.5,T*=2,S*=2;return A/v}function c(f,p,g,_){let y=f*374761393+p*668265263+g*2246822519+_*1442695041|0;return y=Math.imul(y^y>>>13,1274126177),y^=y>>>16,(y>>>0)/4294967296}function h(f,p,g,_=1){let y=Math.floor(f),b=Math.floor(p),A=Math.floor(g),w=r(f-y),v=r(p-b),T=r(g-A),S=(I,P,k)=>c(y+I,b+P,A+k,_),R=(I,P,k)=>I+(P-I)*k;return R(R(R(S(0,0,0),S(1,0,0),w),R(S(0,1,0),S(1,1,0),w),v),R(R(S(0,0,1),S(1,0,1),w),R(S(0,1,1),S(1,1,1),w),v),T)}function u(f,p,g,_=1,y=3){let b=0,A=.5,w=0,v=1;for(let T=0;T<y;T++)b+=A*h(f*v,p*v,g*v,_+T*7),w+=A,A*=.5,v*=2;return b/w}let d={wood(f,p,g){let _=a(f,p,1,4,g+71)-.5,y=a(f,p,2,2,g)-.5,b=p*72+_*4+y*.6,A=.5+.5*Math.sin(2*Math.PI*b),w=.4+1.2*a(f,p,1,6,g+41),v=Math.pow(A,1.5+2.5*w),T=a(f,p,1,2,g+83)-.5,S=.5+.5*Math.sin(2*Math.PI*(p*7+y*1.4+T*.8)),R=Math.pow(S,1.6)*(.5+a(f,p,1,3,g+97)),I=a(f,p,3,128,g+13),P=a(f,p,8,256,g+29),k=a(f,p,1,1,g+3),F=Math.pow(a(f,p,16,3,g+57),6),Z=.3*v+.25*R+.3*I+.15*P,X=1-.035*v-.075*R-.04*(I-.5)-.02*(P-.5)-.06*(k-.5)+.03*F,W=[1,1-.07*R-.03*v,1-.16*R-.06*v];return{h:Z,L:X,T:W,r:.35*v+.3*R+.35*I}},"wood:bark"(f,p,g){let _=a(f,p,2,14,g+5,3),y=a(f,p,4,34,g+29,3),b=Math.abs(2*_-1),A=Math.abs(2*y-1),w=Math.max(0,1-b/.16),v=Math.max(0,1-A/.1),T=Math.max(w*w,.6*v*v),S=a(f,p,9,4,g+11,2),R=a(f,p,40,80,g+17,2),P=.55*Math.pow(Math.min(b/.6,1),.7)*(1-T)+.25*(S-.5)+.2*R,k=.98-.55*T+.14*(S-.5)+.06*(R-.5),F=[1,.95-.1*T,.86-.18*T];return{h:P,L:k,T:F,r:.45+.55*T+.1*(R-.5)}},"wood:endgrain"(f,p,g){let _=f-.5,y=p-.5,b=Math.hypot(_,y),A=Math.atan2(y,_),w=a(f,p,2,2,g+7)-.5,v=a(f,p,1,1,g+19)-.5,T=b*24+w*1.2+v*2.5,S=.5+.5*Math.sin(2*Math.PI*T),I=Math.pow(S,2.2)*(.5+.8*a(f,p,3,3,g+31,2)),P=Math.pow(Math.max(0,Math.cos(A*7+w*6)),40)*Math.min(1,b*3),k=a(f,p,40,40,g+23),F=.5*I+.3*k-.6*P,Z=.93-.12*I-.04*(k-.5)-.3*P+.05*(b<.03?1:0),X=[1,.97-.05*I,.92-.1*I];return{h:F,L:Z,T:X,r:.5+.4*I+.1*k}},"foliage:spray"(f,p,g){let _=null;for(let v=0;v<44;v++){let T=.4*Math.pow(s(v,1,g),.6),S=s(v,2,g)*Math.PI*2,R=.5+T*Math.cos(S),I=.5+T*Math.sin(S),P=s(v,3,g)*Math.PI,k=.075+.055*s(v,4,g),F=k*(.42+.2*s(v,5,g)),Z=Math.cos(P),X=Math.sin(P),W=(f-R)*Z+(p-I)*X,G=-(f-R)*X+(p-I)*Z,K=W/k;if(Math.abs(K)>1)continue;let q=F*Math.sqrt(1-K*K)*(1-.28*(K+1)/2);Math.abs(G)<q&&(_={i:v,t:K,yn:G/q,w:q,y:G})}if(!_)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let y=.86+.26*s(_.i,6,g),b=Math.abs(_.y)<.045*_.w+.004?1:0,A=Math.pow(Math.abs(_.yn),1.5),w=y*(.98-.12*b+.06*A)*(1-.1*(_.t+1)/2);return{h:.5+.3*(1-Math.abs(_.yn))-.3*b,L:w,T:[1-.05*b,1,1-.08*A],r:.65-.2*b,a:1}},"foliage:needles"(f,p,g){let _=Math.abs(p-.5)<.006&&f>.06&&f<.9,y=null;for(let A=0;A<180;A++){let w=A%2?1:-1,v=.08+.82*s(A,1,g),T=w*(.95+.45*(s(A,2,g)-.5))-.35,S=Math.cos(T),R=Math.sin(T),I=.22+.16*s(A,3,g),P=.013;if(S>.001&&(I=Math.min(I,(.94-v)/S)),Math.abs(R)>.001&&(I=Math.min(I,.44/Math.abs(R))),I<.03)continue;let k=(f-v)*S+(p-.5)*R,F=-(f-v)*R+(p-.5)*S;k<0||k>I||Math.abs(F)>P*(1-.6*k/I)||(y={i:A,t:k/I,yn:F/P})}if(_&&!y)return{h:.6,L:.7,T:[1,.9,.8],r:.8,a:1};if(!y)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let b=.8+.28*s(y.i,4,g);return{h:.5+.3*(1-Math.abs(y.yn)),L:b*(.9+.1*y.t),T:[1,1,1],r:.6,a:1}},"foliage:core"(f,p,g){let _=null;for(let b=0;b<90;b++){let A=s(b,1,g),w=s(b,2,g),v=(f-A+1.5)%1-.5,T=(p-w+1.5)%1-.5,S=s(b,3,g)*Math.PI,R=.09+.06*s(b,4,g),I=R*.45,P=Math.cos(S),k=Math.sin(S),F=v*P+T*k,Z=-v*k+T*P,X=F/R;if(Math.abs(X)>1)continue;let W=I*Math.sqrt(1-X*X);Math.abs(Z)<W&&(_={i:b,t:X,yn:Z/W})}if(!_)return{h:.3,L:.45,T:[1,1,1],r:.9,a:1};let y=.55+.35*s(_.i,6,g);return{h:.5+.3*(1-Math.abs(_.yn)),L:y*(.92+.06*_.t),T:[1,1,1],r:.7,a:1}},"foliage:grass"(f,p,g){let _=null;for(let b=0;b<17;b++){let A=.28+.44*s(b,1,g),w=(s(b,2,g)-.5)*.8,v=.5+.45*s(b,3,g),T=p/v;if(T>1)continue;let S=A+w*T*T,R=.02*(1-T)+.002;Math.abs(f-S)<R&&(_={i:b,t:T,yn:(f-S)/R})}if(!_)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let y=.82+.3*s(_.i,4,g);return{h:.5+.3*(1-Math.abs(_.yn)),L:y*(.86+.18*_.t),T:[1-.05*_.t,1,.9],r:.6,a:1}},metal(f,p,g){let _=a(f,p,1,96,g),y=a(f,p,2,256,g+9),b=a(f,p,5,5,g+3);return{h:.6*_+.25*y+.15*b,L:.955+.045*_,r:.6*_+.2*y+.2*b}},fabric(f,p,g,_){let y=_==="wool"?48:_==="velvet"?80:64,b=Math.abs(Math.sin(Math.PI*f*y)),A=Math.abs(Math.sin(Math.PI*p*y)),w=.5+.5*Math.sin(Math.PI*f*y)*Math.sin(Math.PI*p*y),v=a(f,p,6,6,g),T=a(f,p,2,24,g+5),S=.55*Math.max(b,A)+.25*w+.2*v,R=_==="velvet"?.7*v+.3*S:S+.12*(T-.5),I=.95+.04*Math.max(b,A)-.05*(v-.5)-(_==="linen"?.05*Math.max(0,T-.6):0),P=[1,1-.02*w,1-.04*w];return{h:R,L:I,T:P,r:.5+.5*v}},paint(f,p,g){let _=a(f,p,12,12,g),y=a(f,p,3,3,g+11);return{h:.8*_+.2*y,L:.98+.02*_,r:.9*_+.1*y}},ceramic(f,p,g){let _=a(f,p,4,4,g);return{h:_,L:.985+.015*_,r:_}},leather(f,p,g){let _=a(f,p,18,18,g),y=a(f,p,3,3,g+17);return{h:.75*_+.25*y,L:.94+.06*_-.04*(y-.5),r:.5+.5*_}},rubber(f,p,g){let _=a(f,p,10,10,g);return{h:_,L:.96+.04*_,r:.5+.5*_}},fur(f,p,g,_){let y=_==="long",b=_==="plush",A=y?2:b?6:4,w=y?20:b?24:32,v=f+.06*(a(f,p,3,3,g+31)-.5),T=p+.025*(a(f,p,4,4,g+37)-.5),S=(Math.floor(T*w)%w+w)%w,R=v*A+s(S,7,g)*1.7,I=(Math.floor(R)%A+A)%A,P=R-Math.floor(R),k=T*w-Math.floor(T*w),F=s(I,S,g+3),Z=s(S,I,g+5),X=.55+.45*F,W=P<X?Math.pow(Math.sin(Math.PI*P/X),.6):0,G=Math.pow(Math.sin(Math.PI*k),.8),K=W*G*(.55+.45*Z),q=a(f,p,y?2:4,y?96:192,g),Q=a(f,p,2,2,g+21),lt=(b?.4:.6)*K+.4*q,M=.94+.07*K+.04*(q-.5)-.07*(Q-.5),L=[1,1-.03*(1-K),1-.06*(1-K)];return{h:lt,L:M,T:L,r:.5*(1-K)+.5*q}},stone(f,p,g,_){let y=a(f,p,3,3,g),b=a(f,p,9,9,g+7),A=Math.pow(a(f,p,28,28,g+15),3),w=_==="concrete"?a(f,p,40,40,g+23):b;return{h:.45*y+.35*w-.35*A,L:.9+.12*(y-.5)+.06*(w-.5)-.1*A,T:[1,1-.02*y,1-.05*y],r:.5*w+.5*y}},snow(f,p,g){let _=a(f,p,3,3,g),y=a(f,p,40,40,g+5);return{h:.7*_+.3*y,L:.96+.04*y,T:[.985,.995,1],r:y}},foliage(f,p,g){let _=Math.pow(Math.abs(Math.sin(Math.PI*p*10+(a(f,p,3,3,g)-.5)*2)),8),y=a(f,p,24,24,g+9);return{h:.6*_+.4*y,L:.93+.07*y-.06*_,T:[1-.04*y,1,1-.06*y],r:.6*y+.4*(1-_)}},soil(f,p,g){let _=a(f,p,8,8,g),y=a(f,p,48,48,g+11),b=Math.pow(a(f,p,16,16,g+19),5);return{h:.5*_+.3*y+.4*b,L:.88+.14*(_-.5)+.08*(y-.5)+.1*b,r:y}},glass(f,p,g){let _=a(f,p,3,3,g);return{h:_,L:.99+.01*_,r:_}},plastic(f,p,g){let _=a(f,p,30,30,g);return{h:_,L:.985+.015*_,r:_}},emissive(f,p,g){let _=a(f,p,4,4,g);return{h:_,L:.97+.03*_,r:_}},skin(f,p,g){let _=a(f,p,48,48,g),y=a(f,p,3,3,g+3);return{h:_,L:.97+.03*(_-.5)-.03*(y-.5),T:[1,1-.015*y,1-.02*y],r:_}},paper(f,p,g){let _=a(f,p,6,60,g),y=a(f,p,5,5,g+7);return{h:.7*_+.3*y,L:.96+.04*(_-.5)-.03*(y-.5),r:_}},keratin(f,p,g){let _=.5+.5*Math.sin(2*Math.PI*(f*6+(a(f,p,2,2,g)-.5)*.8)),y=a(f,p,2,48,g+5);return{h:.5*_+.5*y,L:.95+.05*y-.04*Math.pow(_,3),r:.5*_+.5*y}}},m=globalThis[Symbol.for("polyfork.materials.maps")]??=new Map;m.has("186")||m.set("186",new Map);let x=m.get("186"),C=(f,p)=>{let g=p>>>0;for(let _=0;_<f.length;_++)g=Math.imul(g^f[_],16777619);return(g>>>0).toString(16).padStart(8,"0")},O=f=>C(f,2166136261)+C(f,2538058380);function V(f,p,g,_){let y=O(f),b=`tex:${g?"s":"l"}:${p}:${y}`;if(x.has(b))return x.get(b);let A=new Jn(f,p,p,Ki);return A.wrapS=A.wrapT=Gn,A.minFilter=$i,A.magFilter=Ji,A.generateMipmaps=!0,A.anisotropy=8,g&&(A.colorSpace=le),A.name=_,A.userData.pfHash=y,A.needsUpdate=!0,x.set(b,A),A}let B=(f,p=null)=>(d[f]||d.paint).length>=4||!!(p&&t[f]&&t[f].finishes[p]&&t[f].finishes[p].pattern);function U(f,p,g){let _=t[f]||t.paint,y=B(f,p),b=`pattern:${f}:${y?p:"*"}:${g}`;if(x.has(b))return x.get(b);let A=_.finishes[p]||{},w=y&&A.size||_.size,v=w*w,T=y&&d[`${f}:${p}`]||d[f]||d.paint,S=new Float32Array(v),R=new Float32Array(v),I=new Uint8Array(v*4),P=new Uint8Array(v*4),k=W=>Math.max(0,Math.min(1,W));for(let W=0;W<w;W++)for(let G=0;G<w;G++){let K=W*w+G,q=T(G/w,W/w,g,p);S[K]=q.h,R[K]=k(q.r);let Q=k(q.L),lt=q.T||[1,1,1];I[K*4]=Math.round(k(Q*lt[0])*255),I[K*4+1]=Math.round(k(Q*lt[1])*255),I[K*4+2]=Math.round(k(Q*lt[2])*255),I[K*4+3]=Math.round(k(q.a??1)*255)}if(I.some((W,G)=>(G&3)===3&&W<128)){let W=new Uint8Array(v);for(let G=0;G<v;G++)W[G]=I[G*4+3]>=128?1:0;for(let G=0;G<6;G++){let K=[];for(let q=0;q<w;q++)for(let Q=0;Q<w;Q++){let lt=q*w+Q;if(W[lt])continue;let M=0,L=0,N=0,z=0,H=0;for(let[nt,Y]of[[1,0],[-1,0],[0,1],[0,-1]]){let j=(q+Y+w)%w*w+(Q+nt+w)%w;W[j]&&(M+=S[j],L+=I[j*4],N+=I[j*4+1],z+=I[j*4+2],H++)}H&&K.push([lt,M/H,L/H,N/H,z/H])}if(!K.length)break;for(let[q,Q,lt,M,L]of K)S[q]=Q,I[q*4]=lt,I[q*4+1]=M,I[q*4+2]=L,W[q]=1}}let F=(y&&A.normal||_.normal)*w*.02;for(let W=0;W<w;W++)for(let G=0;G<w;G++){let K=W*w+G,q=(S[W*w+(G+1)%w]-S[W*w+(G-1+w)%w])*F,Q=(S[(W+1)%w*w+G]-S[(W-1+w)%w*w+G])*F,lt=Math.hypot(q,Q,1);P[K*4]=Math.round((-q/lt*.5+.5)*255),P[K*4+1]=Math.round((-Q/lt*.5+.5)*255),P[K*4+2]=Math.round((1/lt*.5+.5)*255),P[K*4+3]=255}let Z=y?`${f}-${p}`:f,X={S:w,R,map:V(I,w,!0,`${Z}-albedo`),normalMap:V(P,w,!1,`${Z}-normal`)};return x.set(b,X),X}function D(f,p=null,g=1){let _=t[f]||t.paint,y=p&&_.finishes[p]?p:Object.keys(_.finishes)[0],b=`${f}:${y}:${g}`;if(x.has(b))return x.get(b);let A=U(f,y,g),[w,v]=_.finishes[y].roughness||_.roughness,T=A.S*A.S,S=new Uint8Array(T*4);for(let I=0;I<T;I++)S[I*4+1]=Math.round((w+(v-w)*A.R[I])*255),S[I*4+2]=255,S[I*4+3]=255;let R={map:A.map,roughnessMap:V(S,A.S,!1,`${f}-${y}-orm`),normalMap:A.normalMap,tile:_.tile};return x.set(b,R),R}function $(f,p,g=""){let _=f&&typeof f=="object"?f:{kind:"paint"},y=t[_.kind]?_.kind:"paint",b=t[y],A=_.finish&&b.finishes[_.finish]?_.finish:Object.keys(b.finishes)[0],w=b.finishes[A],v=D(y,A,_.seed??1),T=new mt(p??"#cccccc"),S=new ni({color:T,map:v.map,roughnessMap:v.roughnessMap,metalnessMap:v.roughnessMap,roughness:1,metalness:_.metalness??w.metalness??b.metalness,normalMap:v.normalMap,normalScale:new At(1,-1).multiplyScalar(_.normal??w.relief??b.relief??1),envMapIntensity:1,vertexColors:!0});return w.sheen&&(S.sheen=w.sheen,S.sheenRoughness=w.sheenRoughness??.7,S.sheenColor=T.clone().lerp(new mt("#ffffff"),(w.sheenWhite??.55)*(_.whiten??1)),S.userData.sheenWhite=(w.sheenWhite??.5)*(_.whiten??1)),w.clearcoat&&(S.clearcoat=w.clearcoat,S.clearcoatRoughness=w.clearcoatRoughness??.1),w.anisotropy&&(S.anisotropy=w.anisotropy,S.anisotropyRotation=0),w.transmission&&(S.transmission=_.transmission??w.transmission,S.thickness=_.thickness??w.thickness??.01,S.ior=w.ior??1.5,S.attenuationColor=T.clone(),S.attenuationDistance=_.attenuationDistance??.03),w.emissive&&(S.emissive=T.clone(),S.emissiveIntensity=_.intensity??w.emissive,S.userData.emits=!0),w.fire&&et(S,_.intensity??w.emissive),w.cutout&&(S.alphaTest=.5,S.alphaToCoverage=!1,S.side=Oe,S.shadowSide=Oe,S.transparent=!1,S.userData.cutout=!0),w.specular!==void 0&&(S.specularIntensity=w.specular),w.glance!==void 0&&ht(S,w.glance),w.twoSided&&(S.side=Oe,S.shadowSide=Oe),S.name=g,S}let it=globalThis[Symbol.for("polyfork.fires")]||={set:new Set,loop:!1};function et(f,p=2.6){let g={uTime:{value:1.7},uBase:{value:0},uHeight:{value:1},uFire:{value:p}};f.userData.fire=g,f.transparent=!1,f.alphaTest=.5,f.alphaToCoverage=!0,f.side=Oe,f.shadowSide=Oe;let _=f.onBeforeCompile,y=f.customProgramCacheKey;return f.customProgramCacheKey=()=>`${y?y.call(f):""}|pf-fire`,f.onBeforeCompile=(b,A)=>{_&&_.call(f,b,A),Object.assign(b.uniforms,g),b.vertexShader=b.vertexShader.replace("#include <common>",`#include <common>
uniform float uTime; uniform float uBase; uniform float uHeight; varying vec3 vPfPos; varying float vPfH; varying float vPfEdge;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	float pfH = clamp((position.y - uBase) / max(uHeight, 1e-3), 0.0, 1.0);
	float pfS = pfH * pfH * uHeight * 0.10;
	transformed.x += sin(uTime * 6.3 + position.y * 7.0 + position.z * 3.0) * pfS;
	transformed.z += cos(uTime * 5.1 + position.y * 6.0 + position.x * 3.0) * pfS;
	transformed.y += sin(uTime * 8.0 + position.x * 5.0) * pfS * 0.5;
	vPfPos = transformed; vPfH = pfH;
	vPfEdge = abs(dot(normalize(normalMatrix * normal), normalize(-(modelViewMatrix * vec4(transformed, 1.0)).xyz)));   // 1 facing the eye, 0 at the silhouette`),b.fragmentShader=b.fragmentShader.replace("#include <common>",`#include <common>
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
	totalEmissiveRadiance = pfRamp * uFire * (0.35 + 0.85 * pfHeat);   // red edges glow, the core burns`)},it.set.add(f),J(),f}function J(){if(it.loop||typeof requestAnimationFrame!="function")return;it.loop=!0;let f=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches,p=g=>{f||rt(g/1e3),requestAnimationFrame(p)};requestAnimationFrame(p)}function rt(f){for(let p of it.set){let g=p.userData.fire;g&&(g.uTime.value=f)}}function ot(f){let p=[];if(f.updateMatrixWorld(!0),f.traverse(v=>{if(!v.isMesh||!v.geometry)return;let T=[].concat(v.material||[]).map(R=>R&&R.userData.fire).filter(Boolean);if(!T.length)return;v.geometry.boundingBox||v.geometry.computeBoundingBox();let S=v.geometry.boundingBox.clone().applyMatrix4(v.matrixWorld);v.castShadow=!1,v.receiveShadow=!1,p.push({o:v,us:T,wb:S})}),!p.length)return 0;let g=p.map((v,T)=>T),_=v=>{for(;g[v]!==v;)g[v]=g[g[v]],v=g[v];return v};for(let v=0;v<p.length;v++)for(let T=v+1;T<p.length;T++){let S=p[v].wb.clone().expandByScalar(.1*p[v].wb.getSize(new E).length()),R=p[T].wb;if(S.intersectsBox(R)){let I=_(v),P=_(T);I!==P&&(g[I]=P)}}let y=new Map;p.forEach((v,T)=>{let S=_(T);y.has(S)?y.get(S).union(v.wb):y.set(S,v.wb.clone())});let b=new pe,A=new E,w=new E;return p.forEach((v,T)=>{let S=y.get(_(T)),R=S.getCenter(new E);b.copy(v.o.matrixWorld).invert(),A.set(R.x,S.min.y,R.z).applyMatrix4(b),w.set(R.x,S.max.y,R.z).applyMatrix4(b);for(let I of v.us)I.uBase.value=Math.min(A.y,w.y),I.uHeight.value=Math.max(.02,Math.abs(w.y-A.y))}),p.length}function ht(f,p){let g=f.onBeforeCompile,_=f.customProgramCacheKey,y=Number(p).toFixed(3);f.customProgramCacheKey=()=>`${_?_.call(f):""}|pf-glance-${y}`,f.onBeforeCompile=(b,A)=>{g&&g.call(f,b,A),b.fragmentShader=b.fragmentShader.replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
	reflectedLight.directSpecular *= ${y};
	reflectedLight.indirectSpecular *= ${y};`)},f.userData.glance=p}function st(f,p=.5,g=null,_=0){let b=f.attributes.position.count,A=new Float32Array(b*2);return ct(f,A,0,b,p,g,_)}function ct(f,p,g,_,y=.5,b=null,A=0,w=null){let v=f.attributes.position,T=g+_,S=new E,R=new E,I=new E,P=new E,k=1/y;if(Array.isArray(b)&&b.length===3){let F=new E(b[0],b[1],b[2]).normalize(),Z=new E;for(let X=g;X<T;X+=3){S.fromBufferAttribute(v,X),R.fromBufferAttribute(v,X+1),I.fromBufferAttribute(v,X+2),P.subVectors(R,S).cross(I.clone().sub(S)).normalize(),Z.crossVectors(P,F),Z.lengthSq()<1e-8&&Z.set(1,0,0).cross(F),Z.normalize();for(let W=0;W<3;W++){let G=W===0?S:W===1?R:I;p[(X+W)*2]=G.dot(F)*k+A,p[(X+W)*2+1]=G.dot(Z)*k+A*.37}}return f.setAttribute("uv",new Ft(p,2)),f}for(let F=g;F<T;F+=3){S.fromBufferAttribute(v,F),R.fromBufferAttribute(v,F+1),I.fromBufferAttribute(v,F+2),P.subVectors(R,S).cross(I.clone().sub(S));let Z=Math.abs(P.x),X=Math.abs(P.y),W=Math.abs(P.z),G;Z>=X&&Z>=W?G=b==="z"?["z","y"]:["y","z"]:X>=W?G=b==="z"?["z","x"]:["x","z"]:G=b==="x"?["x","y"]:["y","x"];for(let K=0;K<3;K++){let q=K===0?S:K===1?R:I;p[(F+K)*2]=q[G[0]]*k+A,p[(F+K)*2+1]=q[G[1]]*k+A*.37}}return f.setAttribute("uv",new Ft(p,2)),f}function Mt(f,p=30){let g=f.attributes.position,_=g.count,y=_/3,b=new Float32Array(y*3),A=new Float32Array(y),w=new E,v=new E,T=new E,S=new E;for(let F=0;F<y;F++){w.fromBufferAttribute(g,F*3),v.fromBufferAttribute(g,F*3+1),T.fromBufferAttribute(g,F*3+2),S.subVectors(v,w).cross(T.clone().sub(w));let Z=S.length();A[F]=Z,Z>1e-14&&S.divideScalar(Z),b[F*3]=S.x,b[F*3+1]=S.y,b[F*3+2]=S.z}let R=1e4,I=new Map;for(let F=0;F<_;F++){let Z=`${Math.round(g.getX(F)*R)},${Math.round(g.getY(F)*R)},${Math.round(g.getZ(F)*R)}`,X=I.get(Z);X||(X=[],I.set(Z,X)),X.push(F)}let P=Math.cos(p*Math.PI/180),k=new Float32Array(_*3);for(let F of I.values())for(let Z of F){let X=Z/3|0,W=b[X*3],G=b[X*3+1],K=b[X*3+2],q=0,Q=0,lt=0;for(let L of F){let N=L/3|0,z=b[N*3],H=b[N*3+1],nt=b[N*3+2];W*z+G*H+K*nt<P||(q+=z*A[N],Q+=H*A[N],lt+=nt*A[N])}let M=Math.hypot(q,Q,lt);M<1e-12?(q=W,Q=G,lt=K):(q/=M,Q/=M,lt/=M),k[Z*3]=q,k[Z*3+1]=Q,k[Z*3+2]=lt}return f.setAttribute("normal",new Ft(k,3)),f}function ft(f,{amp:p=.004,scale:g=.12,seed:_=1}={}){Mt(f,180);let y=f.attributes.position,b=f.attributes.normal,A=y.count,w=1/g;for(let v=0;v<A;v++){let T=y.getX(v),S=y.getY(v),R=y.getZ(v),I=(u(T*w,S*w,R*w,_)-.5)*2*p;y.setXYZ(v,T+b.getX(v)*I,S+b.getY(v)*I,R+b.getZ(v)*I)}return f.deleteAttribute("normal"),f}function Ht(f,p=[]){let g=f.index?f.toNonIndexed():f;g===f&&(g=f.clone());for(let _ of Object.keys(g.attributes))_!=="position"&&!p.includes(_)&&g.deleteAttribute(_);return g}function Gt(f){let p=t[f.kind]||t.paint,g=p.finishes[f.finish]||{};return f.tile??g.tile??p.tile}function Bt(f,{name:p="part",colors:g={},materials:_={},crease:y=30}={}){let b=new Map;for(let w of f){if(!w||!w.g)continue;let v=w.zone??"body",T=_[v]||{kind:"paint"};b.has(v)||b.set(v,[]);let S=w.uv==="own"&&w.g.getAttribute("uv")?Ht(w.g,["uv"]):st(Ht(w.g),Gt(T),w.grain??T.grain??null,w.shift??0),R=Math.max(.2,Math.min(1.25,w.tone??1)),I=S.attributes.position.count,P=new Float32Array(I*3).fill(R);S.setAttribute("color",new Ft(P,3)),b.get(v).push(S)}let A=new Xn;A.name=p;for(let[w,v]of b){let T=_[w]||{kind:"paint"},S=v.length===1?v[0]:oo(v),R=t[T.kind]&&t[T.kind].finishes[T.finish]?t[T.kind].finishes[T.finish].crease:void 0;Mt(S,R!==void 0?Math.max(T.crease??0,R):T.crease??y);let I=new Zn(S,$(T,g[w],w));I.name=`${p}-${w}`,I.castShadow=I.receiveShadow=!0,A.add(I)}return ot(A),A}function yt(f,p,g=null){return!(p?.transmission>0)||!("transmission"in f)||(f.transmission=p.transmission,f.thickness=p.thickness??0,f.ior=p.ior??1.5,p.attenuationColor&&f.attenuationColor.copy(p.attenuationColor),f.attenuationDistance=p.attenuationDistance??1/0,f.normalMap=null,f.roughnessMap=null,f.metalnessMap=null,f.roughness=Math.min(f.roughness,.08),f.metalness=0,f.side=Oe,f.needsUpdate=!0,g&&(g.castShadow=!1,g.renderOrder=Math.max(g.renderOrder,1))),f}function xt(f,p={},{force:g=!1,cache:_=null}={}){let y=0;return f.traverse(b=>{if(!b.isMesh||!b.material)return;let w=(Array.isArray(b.material)?b.material:[b.material]).map(v=>{if(!v||!v.name||!p[v.name]||!g&&v.map)return v;let T=v.userData&&v.userData.authoredColor,R="#"+(T?new mt().fromArray(T.baseColorFactor):v.color).getHexString(),I=!!b.geometry.attributes.color,P=T&&I?T.vertexScale:null,k=v.transmission>0?"|t"+v.transmission:"",F=v.name+"|"+R+"|"+I+k+(P?"|"+P.join(","):""),Z=_&&_.get(F);return Z||(Z=yt($(p[v.name],R,v.name),v),Z.vertexColors=I,P&&(Z.color.multiply(new mt().fromArray(P)),Z.userData.vertexScale=P),_&&(_.set(F,Z),Z.dispose=()=>{})),k&&yt(Z,v,b),y++,Z});b.material=Array.isArray(b.material)?w:w[0]}),y&&ot(f),y}let bt=[[/\b(flame|fire|ember|glow|bulb|neon|lit|lamp ?light|led)\b/,{kind:"emissive",finish:"glow"}],[/\b(screen|display|monitor face)\b/,{kind:"glass",finish:"clear"}],[/\b(window|pane|glass|bottle|lens|visor|windscreen)\b/,{kind:"glass",finish:"clear"}],[/\b(snow|frost|ice)\b/,{kind:"snow",finish:"powder"}],[/\b(leaf|leaves|petal|grass|moss|stem|vine|foliage|frond|needles?|blossom|bloom|flower)\b/,{kind:"foliage",finish:"leaf"}],[/\b(soil|dirt|sand|gravel|mud|earth|ground|ash)\b/,{kind:"soil",finish:"dry"}],[/\b(stone|rock|concrete|brick|slate|marble|granite|cobble|plinth|masonry|mortar|cement)\b/,{kind:"stone",finish:"rough"}],[/\b(skin|face|hand|arm|leg flesh|brow|cheek|neck)\b/,{kind:"skin",finish:"natural"}],[/\b(denim|jeans)\b/,{kind:"fabric",finish:"denim"}],[/\b(shirt|blouse|dress|skirt|trousers|pants|briefs|bra|sock|cuff|collar|waistband|sleeve|apron|robe|tunic|cloak|scarf|hat band)\b/,{kind:"fabric",finish:"cotton"}],[/\b(jumper|sweater|knit|beanie)\b/,{kind:"fabric",finish:"knit"}],[/\b(sole|tread|tyre|tire)\b/,{kind:"rubber",finish:"black"}],[/\b(paper|book|page|card|cardboard|label|poster|parchment)\b/,{kind:"paper",finish:"plain"}],[/\b(plastic|vinyl|resin|acrylic|bakelite)\b/,{kind:"plastic",finish:"satin"}],[/\b(eye|pupil|iris|lens|glass|glaze|porcelain|ceramic|enamel)\b/,{kind:"ceramic",finish:"glazed"}],[/\b(hoof|hooves|claw|talon|horn|antler|beak|bill|nail|tusk|tooth|teeth|shell|carapace)\b/,{kind:"keratin",finish:"natural"}],[/\b(mane|tail|hair|feather|beard|whisker|brush)\b/,{kind:"fur",finish:"long"}],[/\b(nose|snout|muzzle pad|tongue|lid|lip|pad|skin|inner ear|inner)\b/,{kind:"leather",finish:"grain"}],[/\b(fur|coat|hide|pelt|fleece|wool(?!len)|points|blaze|belly|bib|cream|markings?|flank|sock|cape|ruff|mask)\b/,{kind:"fur",finish:"short"}],[/\b(brass|bronze|copper|gold|steel|iron|chrome|alumin|metal|tin|zinc|rod|rail|bolt|rivet|chain|wire)\b/,{kind:"metal",finish:"brushed"}],[/\b(oak|walnut|ash|pine|timber|wood|plank|board|beam|bamboo|plywood)\b/,{kind:"wood",finish:"oiled"}],[/\b(leather|saddle|strap|harness|belt|boot)\b/,{kind:"leather",finish:"grain"}],[/\b(linen|wool|cotton|canvas|fabric|cloth|cushion|upholster|sail|rug|blanket|curtain|towel|rope|cord)\b/,{kind:"fabric",finish:"linen"}],[/\b(rubber|tyre|tire|gasket)\b/,{kind:"rubber",finish:"black"}],[/\b(tile|sink|basin|bath|toilet|crockery|mug|plate)\b/,{kind:"ceramic",finish:"glazed"}]];function Wt(f={}){let p={};for(let[g,_]of Object.entries(f)){if(!_||_.type!=="color")continue;let y=`${g} ${_.label||""} ${_.describe||""}`.toLowerCase().replace(/_/g," "),b=`${g} ${_.label||""}`.toLowerCase(),A=null;for(let[w,v]of bt)if(w.test(b)){A=v;break}if(!A){for(let[w,v]of bt)if(w.test(y)){A=v;break}}p[g]={...A||{kind:"paint",finish:"matte"},guessed:!0}}return p}let Zt={fur:1,skin:.6,foliage:.8,soil:1,snow:1},Pt={ofSize:.022,min:.003,max:.045};function Ut(f,p,g,_){let y=f.attributes.position,b=y.count,A=b/3;if(g.filter(P=>P>0).length<2)return null;let w=new Uint32Array(b),v=new Map;for(let P=0;P<b;P++){let k=`${Math.round(y.getX(P)*1e4)},${Math.round(y.getY(P)*1e4)},${Math.round(y.getZ(P)*1e4)}`,F=v.get(k);F===void 0&&(F=v.size,v.set(k,F)),w[P]=F}let T=new Map;for(let P=0;P<A;P++){let k=p[P];if(g[k]>0)for(let F=0;F<3;F++){let Z=P*3+F,X=P*3+(F+1)%3,W=w[Z],G=w[X],K=W<G?W*4294967296+G:G*4294967296+W,q=T.get(K);q||(q={i0:Z,i1:X,zones:[],room:1/0},T.set(K,q)),q.zones.includes(k)||q.zones.push(k);let Q=P*3+(F+2)%3,lt=y.getX(X)-y.getX(Z),M=y.getY(X)-y.getY(Z),L=y.getZ(X)-y.getZ(Z),N=y.getX(Q)-y.getX(Z),z=y.getY(Q)-y.getY(Z),H=y.getZ(Q)-y.getZ(Z),nt=M*H-L*z,Y=L*N-lt*H,j=lt*z-M*N,at=Math.sqrt(nt*nt+Y*Y+j*j)/(Math.sqrt(lt*lt+M*M+L*L)||1e-9);at<q.room&&(q.room=at)}}let S=new Map;for(let P of T.values()){if(P.zones.length<2)continue;let k={ax:y.getX(P.i0),ay:y.getY(P.i0),az:y.getZ(P.i0),bx:y.getX(P.i1),by:y.getY(P.i1),bz:y.getZ(P.i1)};for(let F of P.zones){let Z=P.zones.find(W=>W!==F);S.has(F)||S.set(F,[]);let X=Math.max(1e-4,Math.min(_,P.room*.5));S.get(F).push({...k,other:Z,gain:Math.min(g[F],g[Z]),scale:_/X})}}if(!S.size)return null;let R=new Float32Array(b*3),I=new Map;for(let P=0;P<b;P++){let k=p[P/3|0],F=S.get(k);if(!F){R[P*3]=1e3,R[P*3+1]=k;continue}let Z=w[P]*64+k,X=I.get(Z);if(!X){let W=y.getX(P),G=y.getY(P),K=y.getZ(P),q=1/0,Q=k,lt=0;for(let M of F){let L=M.bx-M.ax,N=M.by-M.ay,z=M.bz-M.az,H=L*L+N*N+z*z||1e-12,nt=((W-M.ax)*L+(G-M.ay)*N+(K-M.az)*z)/H;nt=nt<0?0:nt>1?1:nt;let Y=W-(M.ax+L*nt),j=G-(M.ay+N*nt),at=K-(M.az+z*nt),dt=(Y*Y+j*j+at*at)*M.scale*M.scale;dt<q&&(q=dt,Q=M.other,lt=M.gain)}X=[Math.sqrt(q),Q,lt],I.set(Z,X)}R[P*3]=X[0],R[P*3+1]=X[1],R[P*3+2]=X[2]}return R}function Be(f,p){f.defines={...f.defines||{},PF_BLEND_ZONES:p.count},f.customProgramCacheKey=()=>`pf-blend-${p.count}`,f.onBeforeCompile=g=>{g.uniforms.uPfZone=p.zone,g.uniforms.uPfBand=p.band,g.vertexShader=g.vertexShader.replace("#include <common>",`#include <common>
attribute vec3 aPfBlend;
uniform vec3 uPfZone[PF_BLEND_ZONES];
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_vertex>",`#include <color_vertex>
vPfOther = uPfZone[int(aPfBlend.y + 0.5)];
vPfBlend = aPfBlend.xz;`),g.fragmentShader=g.fragmentShader.replace("#include <common>",`#include <common>
uniform float uPfBand;
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_fragment>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
  { float pfT = 0.5 * vPfBlend.y * ( 1.0 - smoothstep( 0.0, uPfBand, vPfBlend.x ) );
    diffuseColor.rgb *= mix( vColor.rgb, vPfOther, pfT );
    #ifdef USE_COLOR_ALPHA
      diffuseColor.a *= vColor.a;
    #endif
  }
#endif`)},f.onBeforeRender=(g,_,y,b)=>{let A=g.info.render.frame;if(p.frame===A&&p.geo===b)return;p.frame=A,p.geo=b;let w=b.attributes.color;if(w)for(let v=0;v<p.count;v++){let T=p.rep[v];T>=0&&p.zone.value[v].set(w.getX(T),w.getY(T),w.getZ(T))}},f.needsUpdate=!0}function fn(f,p={},g={},{force:_=!1,smooth:y="auto",blend:b="auto"}={}){let A=Object.keys(p).filter(T=>g[T]);if(!A.length)return 0;let w=A.map(T=>new mt(p[T])),v=0;return f.traverse(T=>{if(!T.isMesh||!T.geometry||Array.isArray(T.material))return;let S=T.material;if(!S||!S.vertexColors||!_&&S.map)return;let R=T.geometry;R.index&&(R=R.toNonIndexed(),T.geometry.dispose(),T.geometry=R);let I=R.attributes.color,P=R.attributes.position;if(!I||!P)return;let k=P.count/3;R.computeBoundingBox();let F=R.boundingBox,Z=F.max.z-F.min.z>F.max.x-F.min.x?"z":"x",X=Math.max(F.max.x-F.min.x,F.max.y-F.min.y,F.max.z-F.min.z)||1,W=Y=>Math.max(Y.bodyClamp[0],Math.min(Y.bodyClamp[1],X/Y.body)),G=new Uint8Array(k),K=new Array(A.length).fill(0);for(let Y=0;Y<k;Y++){let j=0,at=0,_t=0;for(let zt=0;zt<3;zt++)j+=I.getX(Y*3+zt),at+=I.getY(Y*3+zt),_t+=I.getZ(Y*3+zt);j/=3,at/=3,_t/=3;let dt=0,Ct=1/0;for(let zt=0;zt<w.length;zt++){let Ee=w[zt],tn=(Ee.r-j)**2+(Ee.g-at)**2+(Ee.b-_t)**2;tn<Ct&&(Ct=tn,dt=zt)}G[Y]=dt,K[dt]++}let q=new Uint32Array(k*3),Q=[],lt=0;for(let Y=0;Y<A.length;Y++)Q.push(lt),lt+=K[Y]*3;let M=Q.slice(),L=new Float32Array(P.count*2);for(let Y=0;Y<k;Y++){let j=G[Y],at=Q[j];q[at]=Y*3,q[at+1]=Y*3+1,q[at+2]=Y*3+2,Q[j]+=3;let _t=g[A[j]],dt=t[_t.kind]||t.paint;ct(R,L,Y*3,3,_t.tile??((dt.finishes[_t.finish]||{}).tile??dt.tile)*(dt.body?W(dt):1),_t.grain??Z)}R.setAttribute("uv",new Ft(L,2));let N=y==="auto"?T.isSkinnedMesh?55:35:y;N&&Mt(R,N);let z=b==="auto"||b===!0?1:Math.max(0,Math.min(4,Number(b)||0)),H=null;if(z>0){let Y=A.map(dt=>Math.max(0,Math.min(1,Number(g[dt].blend??Zt[g[dt].kind]??0)))),j=new E;F.getSize(j);let at=Math.max(Pt.min,Math.min(Pt.max,j.length()*Pt.ofSize))*z,_t=Ut(R,G,Y,at);if(_t){R.setAttribute("aPfBlend",new Ft(_t,3));let dt=A.map(()=>-1);for(let Ct=0;Ct<k;Ct++)dt[G[Ct]]<0&&(dt[G[Ct]]=Ct*3);H={count:A.length,rep:dt,band:{value:at},zone:{value:A.map(Ct=>new E().setFromColor(new mt(p[Ct])))},frame:-1,geo:null},R.userData.blendBand=at}}R.setIndex(new Ft(q,1)),R.clearGroups();let nt=[];for(let Y=0;Y<A.length;Y++){if(!K[Y])continue;R.addGroup(M[Y],K[Y]*3,nt.length);let j=$(g[A[Y]],"#ffffff",A[Y]);j.vertexColors=!0,j.flatShading=N?!1:!!S.flatShading,j.sheen&&(j.sheenColor=new mt(p[A[Y]]).lerp(new mt("#ffffff"),j.userData.sheenWhite??.5)),j.userData.emits&&(j.emissive=new mt(p[A[Y]])),S.side!==void 0&&(j.side=S.side),H&&Be(j,H),nt.push(j)}T.material=nt,v++}),v}function ne(f,p,g=18,_=!1){let y=_?[...f,f[0]]:f,b=y.length,A=[];for(let R=0;R<b;R++){let I=_?y[(R-1+b-1)%(b-1)]:y[Math.max(0,R-1)],P=_?y[(R+1)%(b-1)]:y[Math.min(b-1,R+1)];A.push(new E().subVectors(P,I).normalize())}let w=new E(1,0,0);Math.abs(w.dot(A[0]))>.9&&w.set(0,1,0);let v=[];for(let R=0;R<b;R++){let I=A[R];w=w.clone().addScaledVector(I,-w.dot(I)).normalize();let P=new E().crossVectors(I,w).normalize(),k=[];for(let F=0;F<g;F++){let Z=(F+.5)/g*Math.PI*2,X=y[R].clone().addScaledVector(w,Math.cos(Z)*p).addScaledVector(P,Math.sin(Z)*p);k.push([X.x,X.y,X.z])}v.push(k)}_&&(v[b-1]=v[0]);let T=[],S=(R,I,P)=>T.push(R[0],R[1],R[2],I[0],I[1],I[2],P[0],P[1],P[2]);for(let R=0;R<b-1;R++){let I=v[R],P=v[R+1];for(let k=0;k<g;k++){let F=(k+1)%g;S(I[k],I[F],P[F]),S(I[k],P[F],P[k])}}return T}function Xt(f,p,g=10){return ne(f.map(_=>new E(_[0],_[1],_[2])),p,g,!0)}function we(f,p=24,g=0,_=0){let y=f.map(([v,T])=>{let S=[];for(let R=0;R<p;R++){let I=(R+.5)/p*Math.PI*2;S.push([g+Math.cos(I)*v,T,_+Math.sin(I)*v])}return S}),b=[],A=(v,T,S)=>b.push(v[0],v[1],v[2],T[0],T[1],T[2],S[0],S[1],S[2]);for(let v=0;v<y.length-1;v++){let T=y[v],S=y[v+1];for(let R=0;R<p;R++){let I=(R+1)%p;A(T[R],T[I],S[I]),A(T[R],S[I],S[R])}}let w=(v,T,S)=>{let R=[g,T,_];for(let I=0;I<p;I++){let P=(I+1)%p;S?A(R,v[P],v[I]):A(R,v[I],v[P])}};return f[0][0]>0&&w(y[0],f[0][1],!1),f[f.length-1][0]>0&&w(y[y.length-1],f[f.length-1][1],!0),b}function ze(f,p,g,_,y,b,A=.002){let w=new $n(f,p,g,1,1,1).translate(_,y,b),v=f/2,T=g/2,S=[[v,T-A],[v-A,T],[-v+A,T],[-v,T-A],[-v,-T+A],[-v+A,-T],[v-A,-T],[v,-T+A]],R=[],I=(X,W,G)=>R.push(X[0],X[1],X[2],W[0],W[1],W[2],G[0],G[1],G[2]),P=y-p/2,k=y+p/2,F=S.length;for(let X=0;X<F;X++){let W=(X+1)%F,G=[_+S[X][0],P,b+S[X][1]],K=[_+S[W][0],P,b+S[W][1]],q=[_+S[W][0],k,b+S[W][1]],Q=[_+S[X][0],k,b+S[X][1]];I(G,K,q),I(G,q,Q),I([_,k,b],Q,q),I([_,P,b],K,G)}w.dispose();let Z=new me;return Z.setAttribute("position",new te(R,3)),Z}function Ot(f,p,g,_){let y=[];for(let b=0;b<=_;b++){let A=p+(g-p)*b/_;y.push([f*Math.cos(A),f*Math.sin(A)])}return y}function dn(f){let p=new me;return p.setAttribute("position",new te(f,3)),p}function ce(f){let p=(Math.imul(f|0,2654435761)^2654435769)>>>0||1;return()=>(p^=p<<13,p>>>=0,p^=p>>>17,p^=p<<5,p>>>=0,p/4294967296)}let _e=[.84,.92,1,1.07,1.14],Et=(f,p)=>{let g=2*f()-1,_=2*Math.PI*f(),y=Math.sqrt(Math.max(0,1-g*g));return p.set(y*Math.cos(_),g,y*Math.sin(_))},ke=(f,p)=>{let g=Et(p,new E);return g.addScaledVector(f,-g.dot(f)),g.lengthSq()<1e-6&&g.set(0,1,0).addScaledVector(f,-f.y),g.normalize()};class je{constructor(){this.P=_e.map(()=>[]),this.U=_e.map(()=>[])}add(p,g,_,y,b,A,w=!1,v=0){let T=new E().crossVectors(_,g);T.lengthSq()<1e-8&&T.set(1,0,0).cross(g),T.normalize();let S=new E().crossVectors(g,T).normalize(),R=this.P[A],I=this.U[A],P=w?1:0,k=w?0:1,F=(X,W,G,K,q)=>{let Q=(lt,M)=>R.push(p.x+T.x*lt*y+X.x*M*b,p.y+T.y*lt*y+X.y*M*b,p.z+T.z*lt*y+X.z*M*b);Q(-1,K),Q(1,K),Q(1,q),Q(-1,K),Q(1,q),Q(-1,q),I.push(P,W,k,W,k,G,P,W,k,G,P,G)};if(!(v>0)){F(S,0,1,-1,1);return}let Z=v*Math.PI/360;F(S.clone().applyAxisAngle(T,Z),0,.5,-1,0),F(S.clone().applyAxisAngle(T,-Z),.5,1,0,1)}parts(p){let g=[];return _e.forEach((_,y)=>{if(!this.P[y].length)return;let b=dn(this.P[y]);b.setAttribute("uv",new te(this.U[y],2)),g.push({g:b,zone:p,uv:"own",tone:_})}),g}}function ji(f,p,g,_,y=.76,b=.12){let A=new ei(1,2),w=A.attributes.position,v=new E;for(let T=0;T<w.count;T++){v.fromBufferAttribute(w,T);let S=y*(1+b*(u(v.x*1.7+9,v.y*1.7+9,v.z*1.7+9,g,2)*2-1));w.setXYZ(T,f.x+v.x*p.x*S,f.y+v.y*p.y*S,f.z+v.z*p.z*S)}return A.deleteAttribute("normal"),A.deleteAttribute("uv"),{g:A,zone:_,tone:.3}}function qt({lobes:f=[],zone:p="leaf",core:g="leafCore",card:_=.4,density:y=1,seed:b=1,spread:A=.5,inner:w=.5,fold:v=0,facing:T="shell"}={}){let S=ce(b*7919+1),R=new je,I=[],P=f.map(K=>({C:new E().fromArray(K.c),r:Array.isArray(K.r)?new E().fromArray(K.r):new E(K.r,K.r,K.r)})),k=new E,F=new E,Z=new E,X=new E,W=new E,G=(K,q)=>P.some((Q,lt)=>lt!==q&&Math.hypot((K.x-Q.C.x)/Q.r.x,(K.y-Q.C.y)/Q.r.y,(K.z-Q.C.z)/Q.r.z)<.82);return P.forEach(({C:K,r:q},Q)=>{let M=4*Math.PI*Math.pow((Math.pow(q.x*q.y,1.6)+Math.pow(q.x*q.z,1.6)+Math.pow(q.y*q.z,1.6))/3,.625),L=Math.max(12,Math.round(y*3.8*(T==="radial"?1.7:1)*M/(_*_))),N=Math.round(L*(1+w));for(let z=0;z<N;z++){let H=z<L;Et(S,k);let nt=H?.8+.14*S():.55+.25*S();if(Z.set(K.x+k.x*q.x*nt,K.y+k.y*q.y*nt,K.z+k.z*q.z*nt),G(Z,Q))continue;let Y=_*.5*(.8+.4*S()),j=Y*(.85+.3*S()),at=Math.floor(S()*_e.length);if(F.set(k.x/q.x,k.y/q.y,k.z/q.z).normalize(),T==="radial"&&H){let _t=F.clone();ke(_t,S).normalize();let dt=ke(_t,S);W.crossVectors(dt,_t),Z.addScaledVector(_t,-Y*.25),R.add(Z.clone(),dt,W.clone(),Y,j,at,S()<.5,v)}else H?F.lerp(Et(S,X),A).normalize():Et(S,F),R.add(Z.clone(),F.clone(),ke(F,S),Y,j,at,S()<.5,v)}g&&g!=="none"&&I.push(ji(K,q,b+Q*13,g))}),I.concat(R.parts(p))}function Ve({base:f=[0,0,0],rims:p=null,bottom:g=.6,top:_=6,radius:y=1.4,tiers:b=5,taper:A=.08,zone:w="leaf",core:v="leafCore",card:T=.5,density:S=1,seed:R=1,droop:I=25,whorl:P=.35,branches:k=9,trunk:F=.05,step:Z=.3,lip:X=0,segs:W=12}={}){let G=ce(R*104729+3),K=new je,q=[],Q;if(Array.isArray(p)&&p.length)Q=p.map(vt=>({y:+vt.y,r:+vt.r})).sort((vt,Tt)=>vt.y-Tt.y);else{let vt=Math.max(.1,_-g),Tt=vt/(b+.6);Q=[];for(let he=0;he<b;he++){let ie=g+he*Tt;Q.push({y:ie,r:y*(1-(ie-g)/vt*(1-A))})}}let lt=Math.max(_,Q[Q.length-1].y+.3),M=Q[0].y,L=lt-M,N=vt=>{if(vt<=Q[0].y)return Q[0].r;for(let Tt=0;Tt<Q.length;Tt++){let he=Tt+1<Q.length?Q[Tt+1].y:lt;if(vt<=he){let ie=(vt-Q[Tt].y)/Math.max(1e-6,he-Q[Tt].y);return Tt+1<Q.length?Q[Tt].r*(1-Z*ie):Q[Tt].r*Math.max(.05,1-(1-A)*ie)}}return .05*Q[Q.length-1].r},z=vt=>Math.max(.012,F*(1-.8*(vt-M)/L)),H=new E,nt=new E,Y=new E,j=new E,at=new E,_t=new E,dt=new E,Ct=(vt,Tt,he,ie)=>{let Jt=new E().subVectors(Tt,vt);if(Jt.length()<1e-4)return;Jt.normalize();let Te=new E(-Jt.z,0,Jt.x).normalize(),Kt=new E().crossVectors(Jt,Te).normalize(),ve=(St,Lt)=>[30,150,270].map(wt=>{let Rt=wt*Math.PI/180;return[St.x+(Te.x*Math.cos(Rt)+Kt.x*Math.sin(Rt))*Lt,St.y+(Te.y*Math.cos(Rt)+Kt.y*Math.sin(Rt))*Lt,St.z+(Te.z*Math.cos(Rt)+Kt.z*Math.sin(Rt))*Lt]}),ue=ve(vt,he),Ae=ve(Tt,ie);for(let St=0;St<3;St++){let Lt=(St+1)%3;q.push(...ue[St],...Ae[St],...Ae[Lt],...ue[St],...Ae[Lt],...ue[Lt])}},zt=[];for(let vt=M,Tt=0;vt<lt-.06*L;Tt++)zt.push(vt),vt+=P*(.85+.3*G());let Ee=zt.length;zt.forEach((vt,Tt)=>{let he=N(vt),ie=z(vt),Jt=(vt-M)/L,nn=Math.max(3,Math.round(k*S*(.45+.55*(1-Jt)))),Te=Jt>.85,Kt=T*(1-.45*Jt),ve=I*(1-.4*Jt),ue=G()*Math.PI*2;for(let Ae=0;Ae<nn;Ae++){if(G()<.08)continue;let St=ue+(Ae+.5)/nn*Math.PI*2+(G()-.5)*.5*Math.PI*2/nn,Lt=Math.max(.5*Kt,(he*(1+X)-ie)*(.85+.3*G())),wt=((Te?-15:ve)+16*(G()-.5))*Math.PI/180,Rt=wt-(22+12*G())*Math.PI/180;_t.set(-Math.sin(St),0,Math.cos(St));let $t=new E(f[0]+Math.cos(St)*ie*.6,vt,f[2]+Math.sin(St)*ie*.6),se=$t.clone().add(new E(Math.cos(St)*Math.cos(wt),-Math.sin(wt),Math.sin(St)*Math.cos(wt)).multiplyScalar(.55*Lt)),Re=se.clone().add(new E(Math.cos(St)*Math.cos(Rt),-Math.sin(Rt),Math.sin(St)*Math.cos(Rt)).multiplyScalar(.45*Lt)),re=.014+.044*Math.pow(1-Jt,1.3)*Math.min(1,Lt/1.5);Ct($t,se,re,.55*re),Ct(se,Re,.55*re,.12*re);let He=Math.max(2,Math.round(S*Lt/(.5*T))),es=Math.floor(G()*_e.length),uo=new E(0,1,0),pn=new E,ns=new E,is=(mn,oe,sn,Dn,Nn,ss,rs=sn*.75)=>{ns.set(-oe.z,0,oe.x).normalize(),nt.copy(mn).addScaledVector(oe,rs),Y.crossVectors(oe,ns).normalize().applyAxisAngle(oe,1.8*(G()-.5)),K.add(nt.clone(),Y.clone(),at.crossVectors(Y,oe).clone(),sn,Dn,Nn,G()<.5),ss&&(j.copy(ns).applyAxisAngle(oe,.6*(G()-.5)),K.add(nt.clone(),j.clone(),at.crossVectors(j,oe).clone(),sn,Dn*.9,Nn,G()<.5))};(Ae%2===0||Jt>.6)&&(pn.copy(new E(Math.cos(St),1.4,Math.sin(St))).normalize(),is($t,pn,Kt*.4,Kt*.4,es,!0));let Ln=.08*Lt;for(let mn=0;Ln<Lt&&mn<12;mn++){let oe=Ln/Lt,sn=oe>.55,Dn=sn?se:$t,Nn=sn?Re:se,ss=sn?(oe-.55)/.45:oe/.55;dt.lerpVectors(Dn,Nn,Math.min(1,ss)),H.subVectors(Nn,Dn).normalize();let rs=(8+10*G())*Math.PI/180;H.applyAxisAngle(_t,-rs*Math.sign(_t.x*H.z-_t.z*H.x||1)).normalize();let ur=1.15-.7*Math.min(1,oe),rn=Kt*.5*(.85+.35*G())*ur,os=Ln+1.9*rn>=Lt;os&&(rn=Math.max(.3*Kt*.5,Math.min(rn,(Lt-Ln)/1.4)));let fr=Kt*.5*ur*(os?.7:1);if(is(dt,H,rn,fr,(es+mn)%_e.length,!0,rn*.7),oe>.45&&!os)for(let fo of[1,-1])pn.copy(H).applyAxisAngle(uo,fo*(.5+.25*G())).normalize(),pn.y-=.18+.1*G(),pn.normalize(),is(dt,pn,rn*.8,fr*.85,(es+mn+2)%_e.length,!1);Ln+=1.5*rn}}});let tn=lt-.3*T,ts=.35*T,en=.35*T;for(let vt=0;vt<3;vt++){let Tt=vt*Math.PI/3;K.add(new E(f[0],tn,f[2]),new E(Math.cos(Tt),0,Math.sin(Tt)),new E(-Math.sin(Tt),0,Math.cos(Tt)),ts,en,Math.floor(G()*_e.length),!1)}let Pn=K.parts(w);return q.length&&Pn.push({g:dn(q),zone:v,tone:.32}),Pn}return{HD_ENV:o,KINDS:t,MATERIAL_FIELDS:e,HD_BUDGET:n,hdTriBudget:i,noise3:h,fbm3:u,finishShapesPattern:B,mapsFor:D,materialFor:$,animate:rt,fireBounds:ot,boxUV:st,boxUVInto:ct,smoothByAngle:Mt,wrinkle:ft,assemble:Bt,keepSeeThrough:yt,dress:xt,guessMaterials:Wt,dressByAlbedo:fn,sweepTubePositions:ne,weltPositions:Xt,lathePositions:we,chamferedBox:ze,arc:Ot,posGeo:dn,canopy:qt,conifer:Ve}})(),ao=(()=>{let{assemble:o,posGeo:t,smoothByAngle:e}=ih,n="hd",i={"linen-clay":{field:"#F8F4EF",fringe:"#F3EEE8",motif:"#B4AAA0",border:"#B8946A",backing:"#8A6244"},"oat-terracotta":{field:"#FAF8F3",fringe:"#F8F4EF",motif:"#CFC3B0",border:"#C4623F",backing:"#5E5851"},"walnut-ochre":{field:"#E3CBA5",fringe:"#CFC3B0",motif:"#D9A02B",border:"#6B4A32",backing:"#4E3423"},"slate-teal":{field:"#F0F2F1",fringe:"#ECE7E0",motif:"#B4AAA0",border:"#3E7C86",backing:"#5E5851"}},s=i["linen-clay"],r={field:{kind:"fabric",finish:"wool",crease:45,describe:"the undyed wool ground of the weave, warp running the length of the rug (Z)"},fringe:{kind:"fabric",finish:"wool",crease:130,describe:"the warp left unwoven at the two short ends: twisted wool cords, the yarn running along each cord"},motif:{kind:"fabric",finish:"wool",crease:45,describe:"the second weft yarn: the diamond bands, the medallion and the corner blocks, woven in the same wool"},border:{kind:"fabric",finish:"wool",crease:45,describe:"the accent weft of the wide border band, the same wool as the field"},backing:{kind:"fabric",finish:"wool",crease:65,describe:"the wrong side of the weave and the bound cut edge rolling down to the floor"}},l={colorway:{type:"choice",default:"linen-clay",label:"Colorway",options:["linen-clay","oat-terracotta","walnut-ochre","slate-teal"],describe:"Curated kit-coherent scheme; sets all five zone colours at once. linen-clay is the approved reference \u2014 cream wool field, undyed fringe, a clay-tan border and soft grey-blue diamonds. oat-terracotta takes the field to a near white and spends the accent on a burnt-orange frame. walnut-ochre is the dark room: sand wool inside a walnut frame with ochre diamonds. slate-teal is the one cool scheme, a grey-white field inside teal. Every scheme keeps the same value ladder (field lightest, then the fringe, the motif, the border accent, then the backing), so the thumbnail reads the same way in all four."},field:{type:"color",default:s.field,label:"Field",describe:"Albedo of the wool ground \u2014 every weave cell inside the border that is not a motif band. The dominant mass of the rug and what it is named by at a distance; keep it the lightest zone or the border stops reading as a frame."},fringe:{type:"color",default:s.fringe,label:"Fringe",describe:"Albedo of the warp tassels combing off the two short ends. Undyed wool: one shade under the field so the comb separates from the rug it grows out of, but never a contrasting colour \u2014 a fringe is the same yarn left unwoven. Unused when the fringe knob is off."},motif:{type:"color",default:s.motif,label:"Motif",describe:"Albedo of the concentric diamond bands in the field and of the blocks at the four corners of the border. A second yarn, not a second material: one clear value rung under the field so the pattern reads at 64 px without competing with the border. Only used when pattern is geometric."},border:{type:"color",default:s.border,label:"Border",describe:"Albedo of the wide 0.25 m band running unbroken round all four sides. This is the piece's accent colour under the kit's one-accent-per-colourway rule, so it is the strongest hue on the rug and the only saturated one. Unused when pattern is plain, which deletes the band entirely."},backing:{type:"color",default:s.backing,label:"Backing",describe:"Albedo of the underside and of the whole cut edge round the rug \u2014 the wrong side of the weave. The darkest zone by design: it is what draws the rug's 20 mm thickness against a pale floor, and it is the colour that turns up on the rucked corner's return, which is how that fold reads as a fold."},pattern:{type:"choice",default:"geometric",label:"Pattern",options:["plain","bordered","geometric"],describe:"Which of the three woven layouts this rug is, and the reason this is one asset rather than three. plain is undyed wool wall to wall, one flat colour, for a room that already has enough going on. bordered adds the wide accent band round all four sides. geometric is the approved reference: the same band with motif blocks at its four corners and concentric diamond bands stepping out from a small central medallion. Purely a change of yarn \u2014 outline, size, thickness and every vertex are identical at all three values, so a room can swap the layout with no re-fitting."},size:{type:"choice",default:"room",label:"Size",options:["room","runner"],affects:"geometry",describe:"The rug's plan, on the kit's 0.25 m furniture module. room is the briefed 2.0 x 3.0 m, a whole seating group standing on it. runner is 1.0 x 2.0 m, the hall or bedside strip. It REBUILDS rather than scaling: the weave pitch stays at exactly 0.25 m (0.125 m sub-cells in HD) and the cell count goes from 8x12 to 4x8, so the border band, the diamond pitch, the round corners, the fringe cords and the rucked corner are the same absolute size on both and only the number of cells and cords changes. The one thing that does scale is the frame's corner blocks, an L of three cells on the room rug and a single cell on the runner, whose border ring is not wide enough to turn a bigger corner."},fringed:{type:"toggle",default:!0,label:"Fringe",affects:"geometry",describe:"The short warp fringe on the two SHORT ends, as real cord geometry \u2014 never on the long sides, which are the woven selvedge. On (the reference) each end combs out a row of round wool cords on a 0.045 m pitch (39 an end on the room rug), each about 11 mm thick and 0.07 to 0.085 m long, rooted inside the rug's own bound edge and draping off it onto the floor, tips splayed, so the footprint reads about 2.0 x 3.16 m. Off leaves a clean-cut rug at a dead 2.0 x 3.0 m, which is what a machine-bound modern rug looks like and what you want under a bed or a door swing."},pile:{type:"range",default:.25,min:0,max:1,step:.05,label:"Pile",affects:"geometry",describe:"How deep the weave is, as real geometry in the top surface and in the side profile. 0 is a flat-woven kilim: 12 mm thick with a dead-flat face, the rug that disappears under furniture. 0.25 is the approved default at the briefed 20 mm, its face undulating about 3 mm so it facets in raking light. 1.0 is a deep wool pile at 44 mm with 14 mm of undulation, visibly lofted where it meets the floor and chunky in every side view. Changes vertex positions only, never the triangle count."},lived_in:{type:"range",default:0,min:0,max:1,step:.05,label:"Lived in",affects:"geometry",describe:"The kit-wide showroom-to-lived-in axis, and all of it is geometry. A rug spends it on the near corner, on the fringe and on the walking line. 0 is showroom: the rug lies dead flat to the floor (bbox height 0.023 m, the cloth and nothing else), every corner down, the fringe combed dead straight, the pile even. At 0.35 the +X/+Z corner has rucked up over a rolling curl, showing a sliver of its dark backing, its own tassels lifted with it, the rest of the fringe splayed a few degrees out of line, and the pile slightly crushed in a band across the middle where people walk. At 1.0 that corner has rolled right over \u2014 about 120 degrees at the tip, well past vertical, standing about 0.33 m up with the whole underside on show \u2014 the fringe is kicked about 11 degrees out of true, and the walking line is pressed 6 mm into the pile. No colour changes with this knob; it is the shape that moves."}},a={room:{W:2,D:3,NX:8,NZ:12},runner:{W:1,D:2,NX:4,NZ:8}},c=.125,h=.25,u=9,d=.024,m=6,x=121.5,C=2.25,O=.14,V=.045,B=.085,U=.014,D=.0066,$=(st,ct,Mt)=>Math.max(ct,Math.min(Mt,st));function it(st=1){return()=>(st=st*16807%2147483647)/2147483647}let et=st=>(st=$(st,0,1),st*st*(3-2*st));function J(st={}){let ct=i[st.colorway]||s,Mt={field:st.field??ct.field,fringe:st.fringe??ct.fringe,motif:st.motif??ct.motif,border:st.border??ct.border,backing:st.backing??ct.backing},ft=l.pattern.options.includes(st.pattern)?st.pattern:l.pattern.default,Ht=l.size.options.includes(st.size)?st.size:l.size.default,Gt=st.fringed??l.fringed.default,Bt=$(st.pile??l.pile.default,0,1),yt=$(st.lived_in??l.lived_in.default,0,1),{W:xt,D:bt,NX:Wt,NZ:Zt}=a[Ht],Pt=Wt*2,Ut=Zt*2,Be=.012+Bt*.032,fn=Bt*.014,ne=.4*Be,Xt=it(7681),we=(M,L)=>{let N=Math.exp(-Math.pow(L/.36,2)),z=fn*(.55*Math.sin(M*11.3+L*4.1)+.45*Math.sin(M*5.7-L*13.9+2.1));return Be+z*(1-.7*N)-yt*.006*N},ze=(M,L)=>(xt/2-M+(bt/2-L))/c,Ot=[];for(let M=0;M<=Pt;M++){Ot.push([]);for(let L=0;L<=Ut;L++){let N=-xt/2+M*c,z=-bt/2+L*c;Ot[M].push({x:N,z,s:ze(N,z),b:!1,ox:N,oz:z,nx:0,nz:0})}}let dn=[[1,1],[-1,1],[-1,-1],[1,-1]],ce=(M,L,N,z)=>Ot[M>0?Pt-N:N][L>0?Ut-z:z],_e=new Map;for(let[M,L]of dn){let N=ce(M,L,2,2),z=[ce(M,L,0,2)];for(let H=1;H<u;H++){let nt=H/u*Math.PI/2,Y=N.x+M*h*Math.cos(nt),j=N.z+L*h*Math.sin(nt);z.push({x:Y,z:j,s:ze(Y,j),b:!0,ox:Y,oz:j,nx:0,nz:0})}z.push(ce(M,L,2,0)),_e.set(`${M},${L}`,z)}let Et=[],ke=(M,L,N)=>{let z=L<=N?1:-1;for(let H=L;H!==N+z;H+=z)Et.push(M(H))},je=(M,L)=>{let N=_e.get(M);for(let z=1;z<u;z++)Et.push(N[L?z:u-z])};ke(M=>Ot[Pt][M],2,Ut-2),je("1,1",!0),ke(M=>Ot[M][Ut],Pt-2,2),je("-1,1",!1),ke(M=>Ot[0][M],Ut-2,2),je("-1,-1",!0),ke(M=>Ot[M][0],2,Pt-2),je("1,-1",!1);let ji=[{on:M=>M.ox===xt/2&&Math.abs(M.oz)<bt/2-h+1e-9,t:M=>M.oz,L:bt,mv:(M,L)=>{M.ox-=L}},{on:M=>M.ox===-xt/2&&Math.abs(M.oz)<bt/2-h+1e-9,t:M=>M.oz,L:bt,mv:(M,L)=>{M.ox+=L}},{on:M=>M.oz===bt/2&&Math.abs(M.ox)<xt/2-h+1e-9,t:M=>M.ox,L:xt,mv:(M,L)=>{M.oz-=L}},{on:M=>M.oz===-bt/2&&Math.abs(M.ox)<xt/2-h+1e-9,t:M=>M.ox,L:xt,mv:(M,L)=>{M.oz+=L}}];for(let M of ji){let L=Xt()*6.283,N=Xt()*6.283;for(let z of Et){if(z.b||!M.on(z))continue;let H=M.t(z),nt=M.L/2-h-Math.abs(H),Y=.5+.5*(.6*Math.sin(H*5.7+L)+.4*Math.sin(H*11.4+N));M.mv(z,d*Y*et(nt/.35)),z.b=!0}}for(let M of Et)M.b=!0;for(let M=0;M<Et.length;M++){let L=Et[(M-1+Et.length)%Et.length],N=Et[(M+1)%Et.length],z=N.ox-L.ox,H=N.oz-L.oz,nt=Math.hypot(z,H);Et[M].nx=H/nt,Et[M].nz=-z/nt}let qt=[],Ve=(M,L,N,z)=>(qt.push({v:new E(M,L,N),s:z}),qt.length-1),f=new Map,p=new Map,g=new Map,_=M=>{if(!f.has(M)){let L=M.b?M.ox-M.nx*ne:M.x,N=M.b?M.oz-M.nz*ne:M.z;f.set(M,Ve(L,we(L,N),N,M.s))}return f.get(M)},y=M=>(p.has(M)||p.set(M,Ve(M.ox,0,M.oz,M.s)),p.get(M)),b=M=>{if(!g.has(M)){let L=.293*ne,N=M.ox-M.nx*ne,z=M.oz-M.nz*ne;g.set(M,Ve(M.ox-M.nx*L,we(N,z)-L,M.oz-M.nz*L,M.s))}return g.get(M)},A={field:[],motif:[],border:[],backing:[]},w=new E,v=new E,T=(M,L,N,z,H)=>{w.subVectors(qt[N].v,qt[L].v),v.subVectors(qt[z].v,qt[L].v),w.cross(v).dot(H)<0?M.push(L,z,N):M.push(L,N,z)},S=new E(0,1,0),R=new E(0,-1,0),I=Wt>=6&&Zt>=6?1:0,P=Wt/2+Zt/2-3,k=(M,L)=>{let N=$(Math.floor(M),0,Wt-1),z=$(Math.floor(L),0,Zt-1),H=Math.min(N,Wt-1-N),nt=Math.min(z,Zt-1-z);if(ft!=="plain"&&Math.min(H,nt)===0)return ft==="geometric"&&H<=I&&nt<=I?"motif":"border";if(ft==="geometric"){let Y=Math.abs(N+.5-Wt/2)+Math.abs(z+.5-Zt/2);if(Y%3===1&&Y>P-1)return"motif";let j=Math.abs(M-Wt/2)+Math.abs(L-Zt/2),at=Math.floor(j+.5);if((j<1.5||at%3===1)&&at<=P-1)return"motif"}return"field"},F=M=>[(M.x+xt/2)/(2*c),(M.z+bt/2)/(2*c)],Z=[],X=(M,L,N)=>{Z.push([M,L,N]);let[z,H]=F(M),[nt,Y]=F(L),[j,at]=F(N);T(A[k((z+nt+j)/3,(H+Y+at)/3)],_(M),_(L),_(N),S)};for(let M=0;M<Pt;M++)for(let L=0;L<Ut;L++){let N=M>=Pt/2?1:-1,z=L>=Ut/2?1:-1,H=N>0?Pt-1-M:M,nt=z>0?Ut-1-L:L;if(H<=1&&nt<=1&&!(H===1&&nt===1)){H===0&&nt===1&&X(ce(N,z,1,2),ce(N,z,0,2),ce(N,z,1,1)),H===1&&nt===0&&X(ce(N,z,2,1),ce(N,z,1,1),ce(N,z,2,0));continue}let Y=Pt-M+(Ut-L),j=(M+.5-Pt/2)*(L+.5-Ut/2)>0||Y<=m+1,at=Ot[M][L],_t=Ot[M+1][L],dt=Ot[M][L+1],Ct=Ot[M+1][L+1];j?(X(at,dt,_t),X(_t,dt,Ct)):(X(at,Ct,_t),X(at,dt,Ct))}for(let[M,L]of dn){let N=_e.get(`${M},${L}`),z=ce(M,L,1,1);for(let H=0;H<u;H++)X(z,N[H],N[H+1])}for(let M=0;M<Et.length;M++){let L=Et[M],N=Et[(M+1)%Et.length],z=new E(L.nx+N.nx,0,L.nz+N.nz);T(A.backing,_(L),_(N),b(N),z),T(A.backing,_(L),b(N),b(L),z),T(A.backing,b(L),b(N),y(N),z),T(A.backing,b(L),y(N),y(L),z)}let W=Et;if(yt>0){let M=Et.indexOf(Ot[Pt-m][Ut]),L=Et.indexOf(Ot[Pt][Ut-m]);W=[];for(let N=M;W.push(Et[N]),N!==L;N=(N+1)%Et.length);for(let N=1;N<m;N++)W.push(Ot[Pt-N][Ut-m+N]);for(let[N,z,H]of Z)Math.max(N.s,z.s,H.s)<=m+1e-6&&T(A.backing,y(N),y(z),y(H),R)}{W=W.filter((N,z)=>{if(yt>0&&(z===0||z>=W.length-m))return!0;let H=W[(z-1+W.length)%W.length],nt=W[(z+1)%W.length],Y=Math.atan2(N.oz-H.oz,N.ox-H.ox),j=Math.atan2(nt.oz-N.oz,nt.ox-N.ox),at=Math.abs(j-Y);return at>Math.PI&&(at=2*Math.PI-at),at>Math.PI/180});let L=W.map(N=>new At(N.ox,N.oz));for(let[N,z,H]of ti.triangulateShape(L,[]))T(A.backing,y(W[N]),y(W[z]),y(W[H]),R)}let G=[];if(Gt){let M=xt-2*O,L=Math.round(M/V)+1,N=M/(L-1);for(let z of[1,-1]){let H=Et.filter(Y=>z*Y.oz>bt/2-h-1e-6).sort((Y,j)=>Y.ox-j.ox),nt=Y=>{let j=0;for(;j<H.length-2&&H[j+1].ox<Y;)j++;let at=H[j],_t=H[j+1],dt=$((Y-at.ox)/(_t.ox-at.ox),0,1),Ct=at.nx+(_t.nx-at.nx)*dt,zt=at.nz+(_t.nz-at.nz)*dt,Ee=Math.hypot(Ct,zt);return{x:at.ox+(_t.ox-at.ox)*dt,z:at.oz+(_t.oz-at.oz)*dt,nx:Ct/Ee,nz:zt/Ee,s:at.s+(_t.s-at.s)*dt}};for(let Y=0;Y<L;Y++){let j=nt(-M/2+Y*N),at=new E(j.nx,0,j.nz),_t=(Xt()*2-1)*yt*.2,dt=B*(.8+.2*Xt()),Ct=at.clone().applyAxisAngle(S,_t),zt=()=>Xt()<.5?-1:1,Ee=(Xt()-.5)*.2,tn=Ee+zt()*(.06+.08*Xt()),ts=tn+zt()*(.08+.12*Xt()),en=.5*D+6e-4,Pn=Math.max(en,Be-D-.003),vt=wt=>en+(Pn-en)*wt,Tt=.02,he=.45*dt,ie=.78*dt,Jt=new E(j.x,Pn,j.z).addScaledVector(at,-U),nn=new E(j.x,vt(.72),j.z).addScaledVector(Ct,Tt),Te=nn.clone().addScaledVector(Ct.clone().applyAxisAngle(S,Ee),he-Tt);Te.y=vt(.22);let Kt=Te.clone().addScaledVector(Ct.clone().applyAxisAngle(S,tn),ie-he);Kt.y=en+4e-4*Xt();let ve=Kt.clone().addScaledVector(Ct.clone().applyAxisAngle(S,ts),dt-ie);ve.y=en+.0025+.002*Xt();let ue=[Jt,nn,Te,Kt],Ae=[1,1,.95,.85],St=ue.map((wt,Rt)=>{let $t=new E;Rt>0&&$t.add(w.subVectors(wt,ue[Rt-1]).normalize()),$t.add(w.subVectors(Rt<ue.length-1?ue[Rt+1]:ve,wt).normalize()),$t.normalize();let se=new E().crossVectors($t,S).normalize(),Re=new E().crossVectors(se,$t).normalize(),re=D*Ae[Rt];return[wt.clone().addScaledVector(Re,re),wt.clone().addScaledVector(se,.866*re).addScaledVector(Re,-.5*re),wt.clone().addScaledVector(se,-.866*re).addScaledVector(Re,-.5*re)].map(He=>Ve(He.x,He.y,He.z,j.s))}),Lt={tri:[],root:Ve(Jt.x,Jt.y,Jt.z,j.s),tip:Ve(ve.x,ve.y,ve.z,j.s),tone:.93+.1*Xt()};for(let wt=0;wt<ue.length-1;wt++)for(let Rt=0;Rt<3;Rt++){let $t=St[wt][Rt],se=St[wt][(Rt+1)%3],Re=St[wt+1][Rt],re=St[wt+1][(Rt+1)%3],He=qt[$t].v.clone().add(qt[se].v).multiplyScalar(.5).sub(ue[wt]);He.add(qt[Re].v.clone().add(qt[re].v).multiplyScalar(.5).sub(ue[wt+1])),T(Lt.tri,$t,se,re,He),T(Lt.tri,$t,re,Re,He)}for(let wt=0;wt<3;wt++){let Rt=St[3][wt],$t=St[3][(wt+1)%3],se=qt[Rt].v.clone().add(qt[$t].v).multiplyScalar(.5).sub(Kt).add(v.subVectors(ve,Kt));T(Lt.tri,Rt,$t,Lt.tip,se)}G.push(Lt)}}}if(yt>0){let M=[];for(let H=2;H<=m;H++)M.push(Math.pow((m+1-H)/(m-1),C));let L=M.reduce((H,nt)=>H+nt,0),N=yt*x*Math.PI/180,z=new E(1,0,-1).normalize();for(let H=m;H>=2;H--){let nt=-N*M[H-2]/L,Y=qt[_(Ot[Pt-1][Ut-H+1])].v.clone();for(let j of qt)j.s<H-1e-6&&j.v.sub(Y).applyAxisAngle(z,nt).add(Y)}}let K=M=>{let L=new Float32Array(M.length*3);M.forEach((z,H)=>{let nt=qt[z].v;L[H*3]=nt.x,L[H*3+1]=nt.y,L[H*3+2]=nt.z});let N=new me;return N.setAttribute("position",new Ft(L,3)),N},q=[];for(let M of["field","motif","border","backing"])A[M].length&&q.push({g:K(A[M]),zone:M,grain:"z"});for(let M of G){let L=w.subVectors(qt[M.tip].v,qt[M.root].v).normalize();q.push({g:K(M.tri),zone:"fringe",grain:[L.x,L.y,L.z],tone:M.tone})}let Q=o(q,{name:"wool-rug",colors:Mt,materials:r}),lt=Q.children.filter(M=>["wool-rug-field","wool-rug-motif","wool-rug-border"].includes(M.name));if(lt.length>1){let M=lt.reduce((nt,Y)=>nt+Y.geometry.attributes.position.array.length,0),L=new Float32Array(M),N=0;for(let nt of lt)L.set(nt.geometry.attributes.position.array,N),N+=nt.geometry.attributes.position.array.length;let z=new me;z.setAttribute("position",new Ft(L,3)),e(z,r.field.crease);let H=z.attributes.normal.array;N=0;for(let nt of lt){let Y=nt.geometry.attributes.position.array.length;nt.geometry.setAttribute("normal",new Ft(H.slice(N,N+Y),3)),N+=Y}}return Q}return{edition:n,presets:i,materials:r,params:l,createAsset:J,rig:{},detach:[],night:{},default:J}})(),{createAsset:lo,detach:Eg,edition:Tg,materials:Ag,night:Rg,params:co,presets:Cg,rig:Ig}=ao,Pg=ao.default;var rh=lo,oh=co||{},ho=Object.entries(oh).flatMap(([o,t])=>{if(!t||!["choice","range","integer","toggle","color"].includes(t.type))return[];let e={key:o,kind:t.type,label:t.label||o,hint:t.describe||""};if(t.type==="choice"){if(!Array.isArray(t.options)||!t.options.every(n=>typeof n=="string"))return[];e.options=t.options.map(n=>({value:n,label:n}))}if(t.type==="range"||t.type==="integer"){if(![t.min,t.max,t.step].every(Number.isFinite))return[];Object.assign(e,{min:t.min,max:t.max,step:t.step})}return[{...e,default:t.default}]}),ah={controls:ho.map(({default:o,...t})=>t)};function lh(o={}){let t=Object.fromEntries(ho.map(n=>[n.key,o[n.key]??n.default])),e=rh(o);return e.userData.design={applied:t},e}function ch(o){o.traverse(t=>{t.geometry?.dispose(),Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material?.dispose()})}return yo(hh);})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
