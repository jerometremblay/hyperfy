var PolyspoonRecipe=(()=>{var ss=Object.defineProperty;var fa=Object.getOwnPropertyDescriptor;var da=Object.getOwnPropertyNames;var pa=Object.prototype.hasOwnProperty;var ma=(o,t)=>{for(var e in t)ss(o,e,{get:t[e],enumerable:!0})},ga=(o,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of da(t))!pa.call(o,i)&&i!==e&&ss(o,i,{get:()=>t[i],enumerable:!(n=fa(t,i))||n.enumerable});return o};var _a=o=>ga(ss({},"__esModule",{value:!0}),o);var ch={};ma(ch,{createAsset:()=>oh,disposeAsset:()=>lh,metadata:()=>ah});var Lr=1;var Dr=3,Zs=0,Nr=1,Ae=2;var Ur=1;var Fr=100;var Or=204,Br=205;var ws=0,As=1,Rs=2,Si=3,Cs=4,Is=5,Ps=6,Ls=7,Js=0,zr=1,kr=2;var $s=1,Ks=2,js=3,Qs=4,tr=5,er=6,nr=7;var ir=300,Vr=301,sr=302;var Hr=306,Un=1e3,Ln=1001,Ds=1002,Ns=1003;var qi=1006;var Yi=1008;var Gr=1009;var Wr=1015;var Zi=1023;var Fn=2300,Ei=2301,vi=2302,Us=2303,Fs=2400,Os=2401,Bs=2402;var Xr=0;var rr="",jt="srgb",zs="srgb-linear",ks="linear",Mi="srgb";var bi=7680;var qr=519;var Yr=35044;var Dn=2e3,Vs=2001;function xa(o){for(let t=o.length-1;t>=0;--t)if(o[t]>=65535)return!0;return!1}function ya(o){return ArrayBuffer.isView(o)&&!(o instanceof DataView)}function Hs(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}var fr={},Ti=null;function Zr(o){let t=o[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=o[1];e&&e.isStackTrace?o[0]+=" "+e.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function Ut(...o){o=Zr(o);let t="THREE."+o.shift();if(Ti)Ti("warn",t,...o);else{let e=o[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...o)}}function At(...o){o=Zr(o);let t="THREE."+o.shift();if(Ti)Ti("error",t,...o);else{let e=o[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...o)}}function pn(...o){let t=o.join(" ");t in fr||(fr[t]=!0,Ut(...o))}var va={[ws]:As,[Rs]:Ps,[Cs]:Ls,[Si]:Is,[As]:ws,[Ps]:Rs,[Ls]:Cs,[Is]:Si},Ue=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let i=n[t];if(i!==void 0){let s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let i=n.slice(0);for(let s=0,r=i.length;s<r;s++)i[s].call(this,t);t.target=null}}},kt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var fh=Math.PI/180,Ma=180/Math.PI;function Zn(){let o=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(kt[o&255]+kt[o>>8&255]+kt[o>>16&255]+kt[o>>24&255]+"-"+kt[t&255]+kt[t>>8&255]+"-"+kt[t>>16&15|64]+kt[t>>24&255]+"-"+kt[e&63|128]+kt[e>>8&255]+"-"+kt[e>>16&255]+kt[e>>24&255]+kt[n&255]+kt[n>>8&255]+kt[n>>16&255]+kt[n>>24&255]).toLowerCase()}function ht(o,t,e){return Math.max(t,Math.min(e,o))}function ba(o,t){return(o%t+t)%t}function rs(o,t,e){return(1-e)*o+e*t}function An(o,t){switch(t.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Kt(o,t){switch(t.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var bt=class o{static{o.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ht(this.x,t.x,e.x),this.y=ht(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ht(this.x,t,e),this.y=ht(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ht(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ht(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*n-r*i+t.x,this.y=s*i+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Te=class{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,r,l){let a=n[i+0],c=n[i+1],h=n[i+2],d=n[i+3],p=s[r+0],g=s[r+1],M=s[r+2],I=s[r+3];if(d!==I||a!==p||c!==g||h!==M){let k=a*p+c*g+h*M+d*I;k<0&&(p=-p,g=-g,M=-M,I=-I,k=-k);let G=1-l;if(k<.9995){let B=Math.acos(k),U=Math.sin(B);G=Math.sin(G*B)/U,l=Math.sin(l*B)/U,a=a*G+p*l,c=c*G+g*l,h=h*G+M*l,d=d*G+I*l}else{a=a*G+p*l,c=c*G+g*l,h=h*G+M*l,d=d*G+I*l;let B=1/Math.sqrt(a*a+c*c+h*h+d*d);a*=B,c*=B,h*=B,d*=B}}t[e]=a,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,i,s,r){let l=n[i],a=n[i+1],c=n[i+2],h=n[i+3],d=s[r],p=s[r+1],g=s[r+2],M=s[r+3];return t[e]=l*M+h*d+a*g-c*p,t[e+1]=a*M+h*p+c*d-l*g,t[e+2]=c*M+h*g+l*p-a*d,t[e+3]=h*M-l*d-a*p-c*g,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,i=t._y,s=t._z,r=t._order,l=Math.cos,a=Math.sin,c=l(n/2),h=l(i/2),d=l(s/2),p=a(n/2),g=a(i/2),M=a(s/2);switch(r){case"XYZ":this._x=p*h*d+c*g*M,this._y=c*g*d-p*h*M,this._z=c*h*M+p*g*d,this._w=c*h*d-p*g*M;break;case"YXZ":this._x=p*h*d+c*g*M,this._y=c*g*d-p*h*M,this._z=c*h*M-p*g*d,this._w=c*h*d+p*g*M;break;case"ZXY":this._x=p*h*d-c*g*M,this._y=c*g*d+p*h*M,this._z=c*h*M+p*g*d,this._w=c*h*d-p*g*M;break;case"ZYX":this._x=p*h*d-c*g*M,this._y=c*g*d+p*h*M,this._z=c*h*M-p*g*d,this._w=c*h*d+p*g*M;break;case"YZX":this._x=p*h*d+c*g*M,this._y=c*g*d+p*h*M,this._z=c*h*M-p*g*d,this._w=c*h*d-p*g*M;break;case"XZY":this._x=p*h*d-c*g*M,this._y=c*g*d-p*h*M,this._z=c*h*M+p*g*d,this._w=c*h*d+p*g*M;break;default:Ut("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],i=e[4],s=e[8],r=e[1],l=e[5],a=e[9],c=e[2],h=e[6],d=e[10],p=n+l+d;if(p>0){let g=.5/Math.sqrt(p+1);this._w=.25/g,this._x=(h-a)*g,this._y=(s-c)*g,this._z=(r-i)*g}else if(n>l&&n>d){let g=2*Math.sqrt(1+n-l-d);this._w=(h-a)/g,this._x=.25*g,this._y=(i+r)/g,this._z=(s+c)/g}else if(l>d){let g=2*Math.sqrt(1+l-n-d);this._w=(s-c)/g,this._x=(i+r)/g,this._y=.25*g,this._z=(a+h)/g}else{let g=2*Math.sqrt(1+d-n-l);this._w=(r-i)/g,this._x=(s+c)/g,this._y=(a+h)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ht(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,l=e._x,a=e._y,c=e._z,h=e._w;return this._x=n*h+r*l+i*c-s*a,this._y=i*h+r*a+s*l-n*c,this._z=s*h+r*c+n*a-i*l,this._w=r*h-n*l-i*a-s*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,l=this.dot(t);l<0&&(n=-n,i=-i,s=-s,r=-r,l=-l);let a=1-e;if(l<.9995){let c=Math.acos(l),h=Math.sin(c);a=Math.sin(a*c)/h,e=Math.sin(e*c)/h,this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this._onChangeCallback()}else this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},A=class o{static{o.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(dr.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(dr.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=t.elements,r=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*r,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*r,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*r,this}applyQuaternion(t){let e=this.x,n=this.y,i=this.z,s=t.x,r=t.y,l=t.z,a=t.w,c=2*(r*i-l*n),h=2*(l*e-s*i),d=2*(s*n-r*e);return this.x=e+a*c+r*d-l*h,this.y=n+a*h+l*c-s*d,this.z=i+a*d+s*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ht(this.x,t.x,e.x),this.y=ht(this.y,t.y,e.y),this.z=ht(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ht(this.x,t,e),this.y=ht(this.y,t,e),this.z=ht(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ht(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,i=t.y,s=t.z,r=e.x,l=e.y,a=e.z;return this.x=i*a-s*l,this.y=s*r-n*a,this.z=n*l-i*r,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return as.copy(this).projectOnVector(t),this.sub(as)}reflect(t){return this.sub(as.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ht(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},as=new A,dr=new Te,rt=class o{static{o.prototype.isMatrix3=!0}constructor(t,e,n,i,s,r,l,a,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,l,a,c)}set(t,e,n,i,s,r,l,a,c){let h=this.elements;return h[0]=t,h[1]=i,h[2]=l,h[3]=e,h[4]=s,h[5]=a,h[6]=n,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],l=n[3],a=n[6],c=n[1],h=n[4],d=n[7],p=n[2],g=n[5],M=n[8],I=i[0],k=i[3],G=i[6],B=i[1],U=i[4],N=i[7],X=i[2],Y=i[5],$=i[8];return s[0]=r*I+l*B+a*X,s[3]=r*k+l*U+a*Y,s[6]=r*G+l*N+a*$,s[1]=c*I+h*B+d*X,s[4]=c*k+h*U+d*Y,s[7]=c*G+h*N+d*$,s[2]=p*I+g*B+M*X,s[5]=p*k+g*U+M*Y,s[8]=p*G+g*N+M*$,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],l=t[5],a=t[6],c=t[7],h=t[8];return e*r*h-e*l*c-n*s*h+n*l*a+i*s*c-i*r*a}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],l=t[5],a=t[6],c=t[7],h=t[8],d=h*r-l*c,p=l*a-h*s,g=c*s-r*a,M=e*d+n*p+i*g;if(M===0)return this.set(0,0,0,0,0,0,0,0,0);let I=1/M;return t[0]=d*I,t[1]=(i*c-h*n)*I,t[2]=(l*n-i*r)*I,t[3]=p*I,t[4]=(h*e-i*a)*I,t[5]=(i*s-l*e)*I,t[6]=g*I,t[7]=(n*a-c*e)*I,t[8]=(r*e-n*s)*I,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,r,l){let a=Math.cos(s),c=Math.sin(s);return this.set(n*a,n*c,-n*(a*r+c*l)+r+t,-i*c,i*a,-i*(-c*r+a*l)+l+e,0,0,1),this}scale(t,e){return pn("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(os.makeScale(t,e)),this}rotate(t){return pn("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(os.makeRotation(-t)),this}translate(t,e){return pn("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(os.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},os=new rt,pr=new rt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),mr=new rt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Sa(){let o={enabled:!0,workingColorSpace:zs,spaces:{},convert:function(i,s,r){return this.enabled===!1||s===r||!s||!r||(this.spaces[s].transfer===Mi&&(i.r=Ee(i.r),i.g=Ee(i.g),i.b=Ee(i.b)),this.spaces[s].primaries!==this.spaces[r].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===Mi&&(i.r=mn(i.r),i.g=mn(i.g),i.b=mn(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===rr?ks:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,r){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return pn("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return pn("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(i,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return o.define({[zs]:{primaries:t,whitePoint:n,transfer:ks,toXYZ:pr,fromXYZ:mr,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:jt},outputColorSpaceConfig:{drawingBufferColorSpace:jt}},[jt]:{primaries:t,whitePoint:n,transfer:Mi,toXYZ:pr,fromXYZ:mr,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:jt}}}),o}var oe=Sa();function Ee(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function mn(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}var nn,wi=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{nn===void 0&&(nn=Hs("canvas")),nn.width=t.width,nn.height=t.height;let i=nn.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=nn}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Hs("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let r=0;r<s.length;r++)s[r]=Ee(s[r]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ee(e[n]/255)*255):e[n]=Ee(e[n]);return{data:e,width:t.width,height:t.height}}else return Ut("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Ea=0,Ai=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ea++}),this.uuid=Zn(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let r=0,l=i.length;r<l;r++)i[r].isDataTexture?s.push(ls(i[r].image)):s.push(ls(i[r]))}else s=ls(i);n.url=s}return e||(t.images[this.uuid]=n),n}};function ls(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?wi.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(Ut("Texture: Unable to serialize Texture."),{})}var Ta=0,cs=new A,Ye=class o extends Ue{constructor(t=o.DEFAULT_IMAGE,e=o.DEFAULT_MAPPING,n=Ln,i=Ln,s=qi,r=Yi,l=Zi,a=Gr,c=o.DEFAULT_ANISOTROPY,h=rr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ta++}),this.uuid=Zn(),this.name="",this.source=new Ai(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=r,this.anisotropy=c,this.format=l,this.internalFormat=null,this.type=a,this.offset=new bt(0,0),this.repeat=new bt(1,1),this.center=new bt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new rt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(cs).x}get height(){return this.source.getSize(cs).y}get depth(){return this.source.getSize(cs).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Ut(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Ut(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==ir)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Un:t.x=t.x-Math.floor(t.x);break;case Ln:t.x=t.x<0?0:1;break;case Ds:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Un:t.y=t.y-Math.floor(t.y);break;case Ln:t.y=t.y<0?0:1;break;case Ds:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ye.DEFAULT_IMAGE=null;Ye.DEFAULT_MAPPING=ir;Ye.DEFAULT_ANISOTROPY=1;var gn=class o{static{o.prototype.isVector4=!0}constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i+r[12]*s,this.y=r[1]*e+r[5]*n+r[9]*i+r[13]*s,this.z=r[2]*e+r[6]*n+r[10]*i+r[14]*s,this.w=r[3]*e+r[7]*n+r[11]*i+r[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s,a=t.elements,c=a[0],h=a[4],d=a[8],p=a[1],g=a[5],M=a[9],I=a[2],k=a[6],G=a[10];if(Math.abs(h-p)<.01&&Math.abs(d-I)<.01&&Math.abs(M-k)<.01){if(Math.abs(h+p)<.1&&Math.abs(d+I)<.1&&Math.abs(M+k)<.1&&Math.abs(c+g+G-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let U=(c+1)/2,N=(g+1)/2,X=(G+1)/2,Y=(h+p)/4,$=(d+I)/4,q=(M+k)/4;return U>N&&U>X?U<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(U),i=Y/n,s=$/n):N>X?N<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(N),n=Y/i,s=q/i):X<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(X),n=$/s,i=q/s),this.set(n,i,s,e),this}let B=Math.sqrt((k-M)*(k-M)+(d-I)*(d-I)+(p-h)*(p-h));return Math.abs(B)<.001&&(B=1),this.x=(k-M)/B,this.y=(d-I)/B,this.z=(p-h)/B,this.w=Math.acos((c+g+G-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ht(this.x,t.x,e.x),this.y=ht(this.y,t.y,e.y),this.z=ht(this.z,t.z,e.z),this.w=ht(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ht(this.x,t,e),this.y=ht(this.y,t,e),this.z=ht(this.z,t,e),this.w=ht(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ht(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var Ht=class o{static{o.prototype.isMatrix4=!0}constructor(t,e,n,i,s,r,l,a,c,h,d,p,g,M,I,k){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,l,a,c,h,d,p,g,M,I,k)}set(t,e,n,i,s,r,l,a,c,h,d,p,g,M,I,k){let G=this.elements;return G[0]=t,G[4]=e,G[8]=n,G[12]=i,G[1]=s,G[5]=r,G[9]=l,G[13]=a,G[2]=c,G[6]=h,G[10]=d,G[14]=p,G[3]=g,G[7]=M,G[11]=I,G[15]=k,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new o().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,i=1/sn.setFromMatrixColumn(t,0).length(),s=1/sn.setFromMatrixColumn(t,1).length(),r=1/sn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,i=t.y,s=t.z,r=Math.cos(n),l=Math.sin(n),a=Math.cos(i),c=Math.sin(i),h=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){let p=r*h,g=r*d,M=l*h,I=l*d;e[0]=a*h,e[4]=-a*d,e[8]=c,e[1]=g+M*c,e[5]=p-I*c,e[9]=-l*a,e[2]=I-p*c,e[6]=M+g*c,e[10]=r*a}else if(t.order==="YXZ"){let p=a*h,g=a*d,M=c*h,I=c*d;e[0]=p+I*l,e[4]=M*l-g,e[8]=r*c,e[1]=r*d,e[5]=r*h,e[9]=-l,e[2]=g*l-M,e[6]=I+p*l,e[10]=r*a}else if(t.order==="ZXY"){let p=a*h,g=a*d,M=c*h,I=c*d;e[0]=p-I*l,e[4]=-r*d,e[8]=M+g*l,e[1]=g+M*l,e[5]=r*h,e[9]=I-p*l,e[2]=-r*c,e[6]=l,e[10]=r*a}else if(t.order==="ZYX"){let p=r*h,g=r*d,M=l*h,I=l*d;e[0]=a*h,e[4]=M*c-g,e[8]=p*c+I,e[1]=a*d,e[5]=I*c+p,e[9]=g*c-M,e[2]=-c,e[6]=l*a,e[10]=r*a}else if(t.order==="YZX"){let p=r*a,g=r*c,M=l*a,I=l*c;e[0]=a*h,e[4]=I-p*d,e[8]=M*d+g,e[1]=d,e[5]=r*h,e[9]=-l*h,e[2]=-c*h,e[6]=g*d+M,e[10]=p-I*d}else if(t.order==="XZY"){let p=r*a,g=r*c,M=l*a,I=l*c;e[0]=a*h,e[4]=-d,e[8]=c*h,e[1]=p*d+I,e[5]=r*h,e[9]=g*d-M,e[2]=M*d-g,e[6]=l*h,e[10]=I*d+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(wa,t,Aa)}lookAt(t,e,n){let i=this.elements;return ne.subVectors(t,e),ne.lengthSq()===0&&(ne.z=1),ne.normalize(),Ie.crossVectors(n,ne),Ie.lengthSq()===0&&(Math.abs(n.z)===1?ne.x+=1e-4:ne.z+=1e-4,ne.normalize(),Ie.crossVectors(n,ne)),Ie.normalize(),ni.crossVectors(ne,Ie),i[0]=Ie.x,i[4]=ni.x,i[8]=ne.x,i[1]=Ie.y,i[5]=ni.y,i[9]=ne.y,i[2]=Ie.z,i[6]=ni.z,i[10]=ne.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],l=n[4],a=n[8],c=n[12],h=n[1],d=n[5],p=n[9],g=n[13],M=n[2],I=n[6],k=n[10],G=n[14],B=n[3],U=n[7],N=n[11],X=n[15],Y=i[0],$=i[4],q=i[8],Q=i[12],tt=i[1],it=i[5],dt=i[9],lt=i[13],yt=i[2],ot=i[6],It=i[10],wt=i[14],Dt=i[3],St=i[7],Et=i[11],Ct=i[15];return s[0]=r*Y+l*tt+a*yt+c*Dt,s[4]=r*$+l*it+a*ot+c*St,s[8]=r*q+l*dt+a*It+c*Et,s[12]=r*Q+l*lt+a*wt+c*Ct,s[1]=h*Y+d*tt+p*yt+g*Dt,s[5]=h*$+d*it+p*ot+g*St,s[9]=h*q+d*dt+p*It+g*Et,s[13]=h*Q+d*lt+p*wt+g*Ct,s[2]=M*Y+I*tt+k*yt+G*Dt,s[6]=M*$+I*it+k*ot+G*St,s[10]=M*q+I*dt+k*It+G*Et,s[14]=M*Q+I*lt+k*wt+G*Ct,s[3]=B*Y+U*tt+N*yt+X*Dt,s[7]=B*$+U*it+N*ot+X*St,s[11]=B*q+U*dt+N*It+X*Et,s[15]=B*Q+U*lt+N*wt+X*Ct,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],r=t[1],l=t[5],a=t[9],c=t[13],h=t[2],d=t[6],p=t[10],g=t[14],M=t[3],I=t[7],k=t[11],G=t[15],B=a*g-c*p,U=l*g-c*d,N=l*p-a*d,X=r*g-c*h,Y=r*p-a*h,$=r*d-l*h;return e*(I*B-k*U+G*N)-n*(M*B-k*X+G*Y)+i*(M*U-I*X+G*$)-s*(M*N-I*Y+k*$)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[1],r=t[5],l=t[9],a=t[2],c=t[6],h=t[10];return e*(r*h-l*c)-n*(s*h-l*a)+i*(s*c-r*a)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],l=t[5],a=t[6],c=t[7],h=t[8],d=t[9],p=t[10],g=t[11],M=t[12],I=t[13],k=t[14],G=t[15],B=e*l-n*r,U=e*a-i*r,N=e*c-s*r,X=n*a-i*l,Y=n*c-s*l,$=i*c-s*a,q=h*I-d*M,Q=h*k-p*M,tt=h*G-g*M,it=d*k-p*I,dt=d*G-g*I,lt=p*G-g*k,yt=B*lt-U*dt+N*it+X*tt-Y*Q+$*q;if(yt===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let ot=1/yt;return t[0]=(l*lt-a*dt+c*it)*ot,t[1]=(i*dt-n*lt-s*it)*ot,t[2]=(I*$-k*Y+G*X)*ot,t[3]=(p*Y-d*$-g*X)*ot,t[4]=(a*tt-r*lt-c*Q)*ot,t[5]=(e*lt-i*tt+s*Q)*ot,t[6]=(k*N-M*$-G*U)*ot,t[7]=(h*$-p*N+g*U)*ot,t[8]=(r*dt-l*tt+c*q)*ot,t[9]=(n*tt-e*dt-s*q)*ot,t[10]=(M*Y-I*N+G*B)*ot,t[11]=(d*N-h*Y-g*B)*ot,t[12]=(l*Q-r*it-a*q)*ot,t[13]=(e*it-n*Q+i*q)*ot,t[14]=(I*U-M*X-k*B)*ot,t[15]=(h*X-d*U+p*B)*ot,this}scale(t){let e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),i=Math.sin(e),s=1-n,r=t.x,l=t.y,a=t.z,c=s*r,h=s*l;return this.set(c*r+n,c*l-i*a,c*a+i*l,0,c*l+i*a,h*l+n,h*a-i*r,0,c*a-i*l,h*a+i*r,s*a*a+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,r){return this.set(1,n,s,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){let i=this.elements,s=e._x,r=e._y,l=e._z,a=e._w,c=s+s,h=r+r,d=l+l,p=s*c,g=s*h,M=s*d,I=r*h,k=r*d,G=l*d,B=a*c,U=a*h,N=a*d,X=n.x,Y=n.y,$=n.z;return i[0]=(1-(I+G))*X,i[1]=(g+N)*X,i[2]=(M-U)*X,i[3]=0,i[4]=(g-N)*Y,i[5]=(1-(p+G))*Y,i[6]=(k+B)*Y,i[7]=0,i[8]=(M+U)*$,i[9]=(k-B)*$,i[10]=(1-(p+I))*$,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){let i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];let s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let r=sn.set(i[0],i[1],i[2]).length(),l=sn.set(i[4],i[5],i[6]).length(),a=sn.set(i[8],i[9],i[10]).length();s<0&&(r=-r),ue.copy(this);let c=1/r,h=1/l,d=1/a;return ue.elements[0]*=c,ue.elements[1]*=c,ue.elements[2]*=c,ue.elements[4]*=h,ue.elements[5]*=h,ue.elements[6]*=h,ue.elements[8]*=d,ue.elements[9]*=d,ue.elements[10]*=d,e.setFromRotationMatrix(ue),n.x=r,n.y=l,n.z=a,this}makePerspective(t,e,n,i,s,r,l=Dn,a=!1){let c=this.elements,h=2*s/(e-t),d=2*s/(n-i),p=(e+t)/(e-t),g=(n+i)/(n-i),M,I;if(a)M=s/(r-s),I=r*s/(r-s);else if(l===Dn)M=-(r+s)/(r-s),I=-2*r*s/(r-s);else if(l===Vs)M=-r/(r-s),I=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);return c[0]=h,c[4]=0,c[8]=p,c[12]=0,c[1]=0,c[5]=d,c[9]=g,c[13]=0,c[2]=0,c[6]=0,c[10]=M,c[14]=I,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,s,r,l=Dn,a=!1){let c=this.elements,h=2/(e-t),d=2/(n-i),p=-(e+t)/(e-t),g=-(n+i)/(n-i),M,I;if(a)M=1/(r-s),I=r/(r-s);else if(l===Dn)M=-2/(r-s),I=-(r+s)/(r-s);else if(l===Vs)M=-1/(r-s),I=-s/(r-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);return c[0]=h,c[4]=0,c[8]=0,c[12]=p,c[1]=0,c[5]=d,c[9]=0,c[13]=g,c[2]=0,c[6]=0,c[10]=M,c[14]=I,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},sn=new A,ue=new Ht,wa=new A(0,0,0),Aa=new A(1,1,1),Ie=new A,ni=new A,ne=new A,gr=new Ht,_r=new Te,Ze=class o{constructor(t=0,e=0,n=0,i=o.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let i=t.elements,s=i[0],r=i[4],l=i[8],a=i[1],c=i[5],h=i[9],d=i[2],p=i[6],g=i[10];switch(e){case"XYZ":this._y=Math.asin(ht(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,g),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ht(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(l,g),this._z=Math.atan2(a,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(ht(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-d,g),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(a,s));break;case"ZYX":this._y=Math.asin(-ht(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(p,g),this._z=Math.atan2(a,s)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(ht(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(l,g));break;case"XZY":this._z=Math.asin(-ht(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(l,s)):(this._x=Math.atan2(-h,g),this._y=0);break;default:Ut("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return gr.makeRotationFromQuaternion(t),this.setFromRotationMatrix(gr,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return _r.setFromEuler(this),this.setFromQuaternion(_r,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ze.DEFAULT_ORDER="XYZ";var Ri=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Ra=0,xr=new A,rn=new Te,ye=new Ht,ii=new A,Rn=new A,Ca=new A,Ia=new Te,yr=new A(1,0,0),vr=new A(0,1,0),Mr=new A(0,0,1),br={type:"added"},Pa={type:"removed"},an={type:"childadded",child:null},hs={type:"childremoved",child:null},we=class o extends Ue{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ra++}),this.uuid=Zn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=o.DEFAULT_UP.clone();let t=new A,e=new Ze,n=new Te,i=new A(1,1,1);function s(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ht},normalMatrix:{value:new rt}}),this.matrix=new Ht,this.matrixWorld=new Ht,this.matrixAutoUpdate=o.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=o.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ri,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return rn.setFromAxisAngle(t,e),this.quaternion.multiply(rn),this}rotateOnWorldAxis(t,e){return rn.setFromAxisAngle(t,e),this.quaternion.premultiply(rn),this}rotateX(t){return this.rotateOnAxis(yr,t)}rotateY(t){return this.rotateOnAxis(vr,t)}rotateZ(t){return this.rotateOnAxis(Mr,t)}translateOnAxis(t,e){return xr.copy(t).applyQuaternion(this.quaternion),this.position.add(xr.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(yr,t)}translateY(t){return this.translateOnAxis(vr,t)}translateZ(t){return this.translateOnAxis(Mr,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ye.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ii.copy(t):ii.set(t,e,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Rn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ye.lookAt(Rn,ii,this.up):ye.lookAt(ii,Rn,this.up),this.quaternion.setFromRotationMatrix(ye),i&&(ye.extractRotation(i.matrixWorld),rn.setFromRotationMatrix(ye),this.quaternion.premultiply(rn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(At("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(br),an.child=t,this.dispatchEvent(an),an.child=null):At("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Pa),hs.child=t,this.dispatchEvent(hs),hs.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ye.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ye.multiply(t.parent.matrixWorld)),t.applyMatrix4(ye),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(br),an.child=t,this.dispatchEvent(an),an.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){let r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let i=this.children;for(let s=0,r=i.length;s<r;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rn,t,Ca),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rn,Ia,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,i=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*i,s[13]+=n-s[1]*e-s[5]*n-s[9]*i,s[14]+=i-s[2]*e-s[6]*n-s[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let s=this.children;for(let r=0,l=s.length;r<l;r++)s[r].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(l=>({...l,boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(l=>({...l})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(l,a){return l[a.uuid]===void 0&&(l[a.uuid]=a.toJSON(t)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let a=l.shapes;if(Array.isArray(a))for(let c=0,h=a.length;c<h;c++){let d=a[c];s(t.shapes,d)}else s(t.shapes,a)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let a=0,c=this.material.length;a<c;a++)l.push(s(t.materials,this.material[a]));i.material=l}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let l=0;l<this.children.length;l++)i.children.push(this.children[l].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let l=0;l<this.animations.length;l++){let a=this.animations[l];i.animations.push(s(t.animations,a))}}if(e){let l=r(t.geometries),a=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),p=r(t.skeletons),g=r(t.animations),M=r(t.nodes);l.length>0&&(n.geometries=l),a.length>0&&(n.materials=a),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),p.length>0&&(n.skeletons=p),g.length>0&&(n.animations=g),M.length>0&&(n.nodes=M)}return n.object=i,n;function r(l){let a=[];for(let c in l){let h=l[c];delete h.metadata,a.push(h)}return a}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};we.DEFAULT_UP=new A(0,1,0);we.DEFAULT_MATRIX_AUTO_UPDATE=!0;we.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var _n=class extends we{constructor(){super(),this.isGroup=!0,this.type="Group"}};var Jr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pe={h:0,s:0,l:0},si={h:0,s:0,l:0};function us(o,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?o+(t-o)*6*e:e<1/2?t:e<2/3?o+(t-o)*6*(2/3-e):o}var ut=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=jt){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=oe.workingColorSpace){return this.r=t,this.g=e,this.b=n,oe.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=oe.workingColorSpace){if(t=ba(t,1),e=ht(e,0,1),n=ht(n,0,1),e===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+e):n+e-n*e,r=2*n-s;this.r=us(r,s,t+1/3),this.g=us(r,s,t),this.b=us(r,s,t-1/3)}return oe.colorSpaceToWorking(this,i),this}setStyle(t,e=jt){function n(s){s!==void 0&&parseFloat(s)<1&&Ut("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s,r=i[1],l=i[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Ut("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){let s=i[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);Ut("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=jt){let n=Jr[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Ut("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ee(t.r),this.g=Ee(t.g),this.b=Ee(t.b),this}copyLinearToSRGB(t){return this.r=mn(t.r),this.g=mn(t.g),this.b=mn(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=jt){return oe.workingToColorSpace(Vt.copy(this),t),Math.round(ht(Vt.r*255,0,255))*65536+Math.round(ht(Vt.g*255,0,255))*256+Math.round(ht(Vt.b*255,0,255))}getHexString(t=jt){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=oe.workingColorSpace){oe.workingToColorSpace(Vt.copy(this),e);let n=Vt.r,i=Vt.g,s=Vt.b,r=Math.max(n,i,s),l=Math.min(n,i,s),a,c,h=(l+r)/2;if(l===r)a=0,c=0;else{let d=r-l;switch(c=h<=.5?d/(r+l):d/(2-r-l),r){case n:a=(i-s)/d+(i<s?6:0);break;case i:a=(s-n)/d+2;break;case s:a=(n-i)/d+4;break}a/=6}return t.h=a,t.s=c,t.l=h,t}getRGB(t,e=oe.workingColorSpace){return oe.workingToColorSpace(Vt.copy(this),e),t.r=Vt.r,t.g=Vt.g,t.b=Vt.b,t}getStyle(t=jt){oe.workingToColorSpace(Vt.copy(this),t);let e=Vt.r,n=Vt.g,i=Vt.b;return t!==jt?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Pe),this.setHSL(Pe.h+t,Pe.s+e,Pe.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Pe),t.getHSL(si);let n=rs(Pe.h,si.h,e),i=rs(Pe.s,si.s,e),s=rs(Pe.l,si.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Vt=new ut;ut.NAMES=Jr;var fe=new A,ve=new A,fs=new A,Me=new A,on=new A,ln=new A,Sr=new A,ds=new A,ps=new A,ms=new A,gs=new gn,_s=new gn,xs=new gn,Ne=class o{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),fe.subVectors(t,e),i.cross(fe);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){fe.subVectors(i,e),ve.subVectors(n,e),fs.subVectors(t,e);let r=fe.dot(fe),l=fe.dot(ve),a=fe.dot(fs),c=ve.dot(ve),h=ve.dot(fs),d=r*c-l*l;if(d===0)return s.set(0,0,0),null;let p=1/d,g=(c*a-l*h)*p,M=(r*h-l*a)*p;return s.set(1-g-M,M,g)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Me)===null?!1:Me.x>=0&&Me.y>=0&&Me.x+Me.y<=1}static getInterpolation(t,e,n,i,s,r,l,a){return this.getBarycoord(t,e,n,i,Me)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(s,Me.x),a.addScaledVector(r,Me.y),a.addScaledVector(l,Me.z),a)}static getInterpolatedAttribute(t,e,n,i,s,r){return gs.setScalar(0),_s.setScalar(0),xs.setScalar(0),gs.fromBufferAttribute(t,e),_s.fromBufferAttribute(t,n),xs.fromBufferAttribute(t,i),r.setScalar(0),r.addScaledVector(gs,s.x),r.addScaledVector(_s,s.y),r.addScaledVector(xs,s.z),r}static isFrontFacing(t,e,n,i){return fe.subVectors(n,e),ve.subVectors(t,e),fe.cross(ve).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return fe.subVectors(this.c,this.b),ve.subVectors(this.a,this.b),fe.cross(ve).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return o.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return o.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return o.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return o.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return o.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,i=this.b,s=this.c,r,l;on.subVectors(i,n),ln.subVectors(s,n),ds.subVectors(t,n);let a=on.dot(ds),c=ln.dot(ds);if(a<=0&&c<=0)return e.copy(n);ps.subVectors(t,i);let h=on.dot(ps),d=ln.dot(ps);if(h>=0&&d<=h)return e.copy(i);let p=a*d-h*c;if(p<=0&&a>=0&&h<=0)return r=a/(a-h),e.copy(n).addScaledVector(on,r);ms.subVectors(t,s);let g=on.dot(ms),M=ln.dot(ms);if(M>=0&&g<=M)return e.copy(s);let I=g*c-a*M;if(I<=0&&c>=0&&M<=0)return l=c/(c-M),e.copy(n).addScaledVector(ln,l);let k=h*M-g*d;if(k<=0&&d-h>=0&&g-M>=0)return Sr.subVectors(s,i),l=(d-h)/(d-h+(g-M)),e.copy(i).addScaledVector(Sr,l);let G=1/(k+I+p);return r=I*G,l=p*G,e.copy(n).addScaledVector(on,r).addScaledVector(ln,l)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Fe=class{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(de.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(de.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=de.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,l=s.count;r<l;r++)t.isMesh===!0?t.getVertexPosition(r,de):de.fromBufferAttribute(s,r),de.applyMatrix4(t.matrixWorld),this.expandByPoint(de);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ri.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ri.copy(n.boundingBox)),ri.applyMatrix4(t.matrixWorld),this.union(ri)}let i=t.children;for(let s=0,r=i.length;s<r;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,de),de.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Cn),ai.subVectors(this.max,Cn),cn.subVectors(t.a,Cn),hn.subVectors(t.b,Cn),un.subVectors(t.c,Cn),Le.subVectors(hn,cn),De.subVectors(un,hn),We.subVectors(cn,un);let e=[0,-Le.z,Le.y,0,-De.z,De.y,0,-We.z,We.y,Le.z,0,-Le.x,De.z,0,-De.x,We.z,0,-We.x,-Le.y,Le.x,0,-De.y,De.x,0,-We.y,We.x,0];return!ys(e,cn,hn,un,ai)||(e=[1,0,0,0,1,0,0,0,1],!ys(e,cn,hn,un,ai))?!1:(oi.crossVectors(Le,De),e=[oi.x,oi.y,oi.z],ys(e,cn,hn,un,ai))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,de).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(de).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(be[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),be[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),be[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),be[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),be[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),be[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),be[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),be[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(be),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},be=[new A,new A,new A,new A,new A,new A,new A,new A],de=new A,ri=new Fe,cn=new A,hn=new A,un=new A,Le=new A,De=new A,We=new A,Cn=new A,ai=new A,oi=new A,Xe=new A;function ys(o,t,e,n,i){for(let s=0,r=o.length-3;s<=r;s+=3){Xe.fromArray(o,s);let l=i.x*Math.abs(Xe.x)+i.y*Math.abs(Xe.y)+i.z*Math.abs(Xe.z),a=t.dot(Xe),c=e.dot(Xe),h=n.dot(Xe);if(Math.max(-Math.max(a,c,h),Math.min(a,c,h))>l)return!1}return!0}var Nt=new A,li=new bt,La=0,Ot=class extends Ue{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:La++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Yr,this.updateRanges=[],this.gpuType=Wr,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)li.fromBufferAttribute(this,e),li.applyMatrix3(t),this.setXY(e,li.x,li.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.applyMatrix3(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.applyMatrix4(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.applyNormalMatrix(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.transformDirection(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=An(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Kt(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=An(e,this.array)),e}setX(t,e){return this.normalized&&(e=Kt(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=An(e,this.array)),e}setY(t,e){return this.normalized&&(e=Kt(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=An(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Kt(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=An(e,this.array)),e}setW(t,e){return this.normalized&&(e=Kt(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Kt(e,this.array),n=Kt(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Kt(e,this.array),n=Kt(n,this.array),i=Kt(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=Kt(e,this.array),n=Kt(n,this.array),i=Kt(i,this.array),s=Kt(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Ci=class extends Ot{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Ii=class extends Ot{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Gt=class extends Ot{constructor(t,e,n){super(new Float32Array(t),e,n)}},Da=new Fe,In=new A,vs=new A,On=class{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Da.setFromPoints(t).getCenter(n);let i=0;for(let s=0,r=t.length;s<r;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;In.subVectors(t,this.center);let e=In.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(In,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(vs.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(In.copy(t.center).add(vs)),this.expandByPoint(In.copy(t.center).sub(vs))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Na=0,ae=new Ht,Ms=new we,fn=new A,ie=new Fe,Pn=new Fe,Bt=new A,pe=class o extends Ue{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Na++}),this.uuid=Zn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(xa(t)?Ii:Ci)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new rt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return ae.makeRotationFromQuaternion(t),this.applyMatrix4(ae),this}rotateX(t){return ae.makeRotationX(t),this.applyMatrix4(ae),this}rotateY(t){return ae.makeRotationY(t),this.applyMatrix4(ae),this}rotateZ(t){return ae.makeRotationZ(t),this.applyMatrix4(ae),this}translate(t,e,n){return ae.makeTranslation(t,e,n),this.applyMatrix4(ae),this}scale(t,e,n){return ae.makeScale(t,e,n),this.applyMatrix4(ae),this}lookAt(t){return Ms.lookAt(t),Ms.updateMatrix(),this.applyMatrix4(Ms.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(fn).negate(),this.translate(fn.x,fn.y,fn.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let i=0,s=t.length;i<s;i++){let r=t[i];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Gt(n,3))}else{let n=Math.min(t.length,e.count);for(let i=0;i<n;i++){let s=t[i];e.setXYZ(i,s.x,s.y,s.z||0)}t.length>e.count&&Ut("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fe);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){At("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){let s=e[n];ie.setFromBufferAttribute(s),this.morphTargetsRelative?(Bt.addVectors(this.boundingBox.min,ie.min),this.boundingBox.expandByPoint(Bt),Bt.addVectors(this.boundingBox.max,ie.max),this.boundingBox.expandByPoint(Bt)):(this.boundingBox.expandByPoint(ie.min),this.boundingBox.expandByPoint(ie.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&At('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new On);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){At("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){let n=this.boundingSphere.center;if(ie.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){let l=e[s];Pn.setFromBufferAttribute(l),this.morphTargetsRelative?(Bt.addVectors(ie.min,Pn.min),ie.expandByPoint(Bt),Bt.addVectors(ie.max,Pn.max),ie.expandByPoint(Bt)):(ie.expandByPoint(Pn.min),ie.expandByPoint(Pn.max))}ie.getCenter(n);let i=0;for(let s=0,r=t.count;s<r;s++)Bt.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Bt));if(e)for(let s=0,r=e.length;s<r;s++){let l=e[s],a=this.morphTargetsRelative;for(let c=0,h=l.count;c<h;c++)Bt.fromBufferAttribute(l,c),a&&(fn.fromBufferAttribute(t,c),Bt.add(fn)),i=Math.max(i,n.distanceToSquared(Bt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&At('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){At("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,i=e.normal,s=e.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==n.count)&&(r=new Ot(new Float32Array(4*n.count),4),this.setAttribute("tangent",r));let l=[],a=[];for(let q=0;q<n.count;q++)l[q]=new A,a[q]=new A;let c=new A,h=new A,d=new A,p=new bt,g=new bt,M=new bt,I=new A,k=new A;function G(q,Q,tt){c.fromBufferAttribute(n,q),h.fromBufferAttribute(n,Q),d.fromBufferAttribute(n,tt),p.fromBufferAttribute(s,q),g.fromBufferAttribute(s,Q),M.fromBufferAttribute(s,tt),h.sub(c),d.sub(c),g.sub(p),M.sub(p);let it=1/(g.x*M.y-M.x*g.y);isFinite(it)&&(I.copy(h).multiplyScalar(M.y).addScaledVector(d,-g.y).multiplyScalar(it),k.copy(d).multiplyScalar(g.x).addScaledVector(h,-M.x).multiplyScalar(it),l[q].add(I),l[Q].add(I),l[tt].add(I),a[q].add(k),a[Q].add(k),a[tt].add(k))}let B=this.groups;B.length===0&&(B=[{start:0,count:t.count}]);for(let q=0,Q=B.length;q<Q;++q){let tt=B[q],it=tt.start,dt=tt.count;for(let lt=it,yt=it+dt;lt<yt;lt+=3)G(t.getX(lt+0),t.getX(lt+1),t.getX(lt+2))}let U=new A,N=new A,X=new A,Y=new A;function $(q){X.fromBufferAttribute(i,q),Y.copy(X);let Q=l[q];U.copy(Q),U.sub(X.multiplyScalar(X.dot(Q))).normalize(),N.crossVectors(Y,Q);let it=N.dot(a[q])<0?-1:1;r.setXYZW(q,U.x,U.y,U.z,it)}for(let q=0,Q=B.length;q<Q;++q){let tt=B[q],it=tt.start,dt=tt.count;for(let lt=it,yt=it+dt;lt<yt;lt+=3)$(t.getX(lt+0)),$(t.getX(lt+1)),$(t.getX(lt+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Ot(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,g=n.count;p<g;p++)n.setXYZ(p,0,0,0);let i=new A,s=new A,r=new A,l=new A,a=new A,c=new A,h=new A,d=new A;if(t)for(let p=0,g=t.count;p<g;p+=3){let M=t.getX(p+0),I=t.getX(p+1),k=t.getX(p+2);i.fromBufferAttribute(e,M),s.fromBufferAttribute(e,I),r.fromBufferAttribute(e,k),h.subVectors(r,s),d.subVectors(i,s),h.cross(d),l.fromBufferAttribute(n,M),a.fromBufferAttribute(n,I),c.fromBufferAttribute(n,k),l.add(h),a.add(h),c.add(h),n.setXYZ(M,l.x,l.y,l.z),n.setXYZ(I,a.x,a.y,a.z),n.setXYZ(k,c.x,c.y,c.z)}else for(let p=0,g=e.count;p<g;p+=3)i.fromBufferAttribute(e,p+0),s.fromBufferAttribute(e,p+1),r.fromBufferAttribute(e,p+2),h.subVectors(r,s),d.subVectors(i,s),h.cross(d),n.setXYZ(p+0,h.x,h.y,h.z),n.setXYZ(p+1,h.x,h.y,h.z),n.setXYZ(p+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Bt.fromBufferAttribute(t,e),Bt.normalize(),t.setXYZ(e,Bt.x,Bt.y,Bt.z)}toNonIndexed(){function t(l,a){let c=l.array,h=l.itemSize,d=l.normalized,p=new c.constructor(a.length*h),g=0,M=0;for(let I=0,k=a.length;I<k;I++){l.isInterleavedBufferAttribute?g=a[I]*l.data.stride+l.offset:g=a[I]*h;for(let G=0;G<h;G++)p[M++]=c[g++]}return new Ot(p,h,d)}if(this.index===null)return Ut("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new o,n=this.index.array,i=this.attributes;for(let l in i){let a=i[l],c=t(a,n);e.setAttribute(l,c)}let s=this.morphAttributes;for(let l in s){let a=[],c=s[l];for(let h=0,d=c.length;h<d;h++){let p=c[h],g=t(p,n);a.push(g)}e.morphAttributes[l]=a}e.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let l=0,a=r.length;l<a;l++){let c=r[l];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let c in a)a[c]!==void 0&&(t[c]=a[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let a in n){let c=n[a];t.data.attributes[a]=c.toJSON(t.data)}let i={},s=!1;for(let a in this.morphAttributes){let c=this.morphAttributes[a],h=[];for(let d=0,p=c.length;d<p;d++){let g=c[d];h.push(g.toJSON(t.data))}h.length>0&&(i[a]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let l=this.boundingSphere;return l!==null&&(t.data.boundingSphere=l.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let i=t.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(e))}let s=t.morphAttributes;for(let c in s){let h=[],d=s[c];for(let p=0,g=d.length;p<g;p++)h.push(d[p].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,h=r.length;c<h;c++){let d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}let l=t.boundingBox;l!==null&&(this.boundingBox=l.clone());let a=t.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var bs=new A,Ua=new A,Fa=new rt,Pi=class{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let i=bs.subVectors(n,e).cross(Ua.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let i=t.delta(bs),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(r<0||r>1)?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Fa.getNormalMatrix(t),i=this.coplanarPoint(bs).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},Oa=0,Bn=class extends Ue{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Oa++}),this.uuid=Zn(),this.name="",this.type="Material",this.blending=Ur,this.side=Zs,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Or,this.blendDst=Br,this.blendEquation=Fr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ut(0,0,0),this.blendAlpha=0,this.depthFunc=Si,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=qr,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=bi,this.stencilZFail=bi,this.stencilZPass=bi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Ut(`Material: parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Ut(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){let r=[];for(let l in s){let a=s[l];delete a.metadata,r.push(a)}return r}if(e){let s=i(t.textures),r=i(t.images);s.length>0&&(n.textures=s),r.length>0&&(n.images=r)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new ut().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Pi().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new bt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new bt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var Se=new A,Ss=new A,ci=new A,hi=new A,Li=class{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Se)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Se.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Se.copy(this.origin).addScaledVector(this.direction,e),Se.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Ss.copy(t).add(e).multiplyScalar(.5),ci.copy(e).sub(t).normalize(),hi.copy(this.origin).sub(Ss);let s=t.distanceTo(e)*.5,r=-this.direction.dot(ci),l=hi.dot(this.direction),a=-hi.dot(ci),c=hi.lengthSq(),h=Math.abs(1-r*r),d,p,g,M;if(h>0)if(d=r*a-l,p=r*l-a,M=s*h,d>=0)if(p>=-M)if(p<=M){let I=1/h;d*=I,p*=I,g=d*(d+r*p+2*l)+p*(r*d+p+2*a)+c}else p=s,d=Math.max(0,-(r*p+l)),g=-d*d+p*(p+2*a)+c;else p=-s,d=Math.max(0,-(r*p+l)),g=-d*d+p*(p+2*a)+c;else p<=-M?(d=Math.max(0,-(-r*s+l)),p=d>0?-s:Math.min(Math.max(-s,-a),s),g=-d*d+p*(p+2*a)+c):p<=M?(d=0,p=Math.min(Math.max(-s,-a),s),g=p*(p+2*a)+c):(d=Math.max(0,-(r*s+l)),p=d>0?s:Math.min(Math.max(-s,-a),s),g=-d*d+p*(p+2*a)+c);else p=r>0?-s:s,d=Math.max(0,-(r*p+l)),g=-d*d+p*(p+2*a)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),i&&i.copy(Ss).addScaledVector(ci,p),g}intersectSphere(t,e){if(t.radius<0)return null;Se.subVectors(t.center,this.origin);let n=Se.dot(this.direction),i=Se.dot(Se)-n*n,s=t.radius*t.radius;if(i>s)return null;let r=Math.sqrt(s-i),l=n-r,a=n+r;return a<0?null:l<0?this.at(a,e):this.at(l,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,r,l,a,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,p=this.origin;return c>=0?(n=(t.min.x-p.x)*c,i=(t.max.x-p.x)*c):(n=(t.max.x-p.x)*c,i=(t.min.x-p.x)*c),h>=0?(s=(t.min.y-p.y)*h,r=(t.max.y-p.y)*h):(s=(t.max.y-p.y)*h,r=(t.min.y-p.y)*h),n>r||s>i||((s>n||isNaN(n))&&(n=s),(r<i||isNaN(i))&&(i=r),d>=0?(l=(t.min.z-p.z)*d,a=(t.max.z-p.z)*d):(l=(t.max.z-p.z)*d,a=(t.min.z-p.z)*d),n>a||l>i)||((l>n||n!==n)&&(n=l),(a<i||i!==i)&&(i=a),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,Se)!==null}intersectTriangle(t,e,n,i,s){let r=this.origin,l=this.direction,a=l.x,c=l.y,h=l.z,d=t.x-r.x,p=t.y-r.y,g=t.z-r.z,M=e.x-r.x,I=e.y-r.y,k=e.z-r.z,G=n.x-r.x,B=n.y-r.y,U=n.z-r.z,N=Math.abs(a),X=Math.abs(c),Y=Math.abs(h),$,q,Q,tt,it,dt,lt,yt,ot,It,wt,Dt;if(N>=X&&N>=Y?(Q=a,dt=d,ot=M,Dt=G,a>=0?($=c,q=h,tt=p,it=g,lt=I,yt=k,It=B,wt=U):($=h,q=c,tt=g,it=p,lt=k,yt=I,It=U,wt=B)):X>=Y?(Q=c,dt=p,ot=I,Dt=B,c>=0?($=h,q=a,tt=g,it=d,lt=k,yt=M,It=U,wt=G):($=a,q=h,tt=d,it=g,lt=M,yt=k,It=G,wt=U)):(Q=h,dt=g,ot=k,Dt=U,h>=0?($=a,q=c,tt=d,it=p,lt=M,yt=I,It=G,wt=B):($=c,q=a,tt=p,it=d,lt=I,yt=M,It=B,wt=G)),Q===0)return null;let St=$/Q,Et=q/Q,Ct=1/Q,Xt=tt-St*dt,qt=it-Et*dt,le=lt-St*ot,Yt=yt-Et*ot,ce=It-St*Dt,vt=wt-Et*Dt,re=ce*Yt-vt*le,he=Xt*vt-qt*ce,Zt=le*qt-Yt*Xt;if(i){if(re<0||he<0||Zt<0)return null}else if((re<0||he<0||Zt<0)&&(re>0||he>0||Zt>0))return null;let $e=re+he+Zt;if($e===0)return null;let ke=Ct*(re*dt+he*ot+Zt*Dt);return($e>0?ke<0:ke>0)?null:this.at(ke/$e,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Di=class extends Bn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ze,this.combine=Js,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Er=new Ht,qe=new Li,ui=new On,Tr=new A,fi=new A,di=new A,pi=new A,Es=new A,mi=new A,wr=new A,gi=new A,zn=class extends we{constructor(t=new pe,e=new Di){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){let l=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=s}}}}getVertexPosition(t,e){let n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(i,t);let l=this.morphTargetInfluences;if(s&&l){mi.set(0,0,0);for(let a=0,c=s.length;a<c;a++){let h=l[a],d=s[a];h!==0&&(Es.fromBufferAttribute(d,t),r?mi.addScaledVector(Es,h):mi.addScaledVector(Es.sub(e),h))}e.add(mi)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ui.copy(n.boundingSphere),ui.applyMatrix4(s),qe.copy(t.ray).recast(t.near),!(ui.containsPoint(qe.origin)===!1&&(qe.intersectSphere(ui,Tr)===null||qe.origin.distanceToSquared(Tr)>(t.far-t.near)**2))&&(Er.copy(s).invert(),qe.copy(t.ray).applyMatrix4(Er),!(n.boundingBox!==null&&qe.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,qe)))}_computeIntersections(t,e,n){let i,s=this.geometry,r=this.material,l=s.index,a=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,p=s.groups,g=s.drawRange;if(l!==null)if(Array.isArray(r))for(let M=0,I=p.length;M<I;M++){let k=p[M],G=r[k.materialIndex],B=Math.max(k.start,g.start),U=Math.min(l.count,Math.min(k.start+k.count,g.start+g.count));for(let N=B,X=U;N<X;N+=3){let Y=l.getX(N),$=l.getX(N+1),q=l.getX(N+2);i=_i(this,G,t,n,c,h,d,Y,$,q),i&&(i.faceIndex=Math.floor(N/3),i.face.materialIndex=k.materialIndex,e.push(i))}}else{let M=Math.max(0,g.start),I=Math.min(l.count,g.start+g.count);for(let k=M,G=I;k<G;k+=3){let B=l.getX(k),U=l.getX(k+1),N=l.getX(k+2);i=_i(this,r,t,n,c,h,d,B,U,N),i&&(i.faceIndex=Math.floor(k/3),e.push(i))}}else if(a!==void 0)if(Array.isArray(r))for(let M=0,I=p.length;M<I;M++){let k=p[M],G=r[k.materialIndex],B=Math.max(k.start,g.start),U=Math.min(a.count,Math.min(k.start+k.count,g.start+g.count));for(let N=B,X=U;N<X;N+=3){let Y=N,$=N+1,q=N+2;i=_i(this,G,t,n,c,h,d,Y,$,q),i&&(i.faceIndex=Math.floor(N/3),i.face.materialIndex=k.materialIndex,e.push(i))}}else{let M=Math.max(0,g.start),I=Math.min(a.count,g.start+g.count);for(let k=M,G=I;k<G;k+=3){let B=k,U=k+1,N=k+2;i=_i(this,r,t,n,c,h,d,B,U,N),i&&(i.faceIndex=Math.floor(k/3),e.push(i))}}}};function Ba(o,t,e,n,i,s,r,l){let a;if(t.side===Nr?a=n.intersectTriangle(r,s,i,!0,l):a=n.intersectTriangle(i,s,r,t.side===Zs,l),a===null)return null;gi.copy(l),gi.applyMatrix4(o.matrixWorld);let c=e.ray.origin.distanceTo(gi);return c<e.near||c>e.far?null:{distance:c,point:gi.clone(),object:o}}function _i(o,t,e,n,i,s,r,l,a,c){o.getVertexPosition(l,fi),o.getVertexPosition(a,di),o.getVertexPosition(c,pi);let h=Ba(o,t,e,n,fi,di,pi,wr);if(h){let d=new A;Ne.getBarycoord(wr,fi,di,pi,d),i&&(h.uv=Ne.getInterpolatedAttribute(i,l,a,c,d,new bt)),s&&(h.uv1=Ne.getInterpolatedAttribute(s,l,a,c,d,new bt)),r&&(h.normal=Ne.getInterpolatedAttribute(r,l,a,c,d,new A),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let p={a:l,b:a,c,normal:new A,materialIndex:0};Ne.getNormal(fi,di,pi,p.normal),h.face=p,h.barycoord=d}return h}var kn=class extends Ye{constructor(t=null,e=1,n=1,i,s,r,l,a,c=Ns,h=Ns,d,p){super(null,r,l,a,c,h,i,s,d,p),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Vn=class o extends pe{constructor(t=1,e=1,n=1,i=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:r};let l=this;i=Math.floor(i),s=Math.floor(s),r=Math.floor(r);let a=[],c=[],h=[],d=[],p=0,g=0;M("z","y","x",-1,-1,n,e,t,r,s,0),M("z","y","x",1,-1,n,e,-t,r,s,1),M("x","z","y",1,1,t,n,e,i,r,2),M("x","z","y",1,-1,t,n,-e,i,r,3),M("x","y","z",1,-1,t,e,n,i,s,4),M("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(a),this.setAttribute("position",new Gt(c,3)),this.setAttribute("normal",new Gt(h,3)),this.setAttribute("uv",new Gt(d,2));function M(I,k,G,B,U,N,X,Y,$,q,Q){let tt=N/$,it=X/q,dt=N/2,lt=X/2,yt=Y/2,ot=$+1,It=q+1,wt=0,Dt=0,St=new A;for(let Et=0;Et<It;Et++){let Ct=Et*it-lt;for(let Xt=0;Xt<ot;Xt++){let qt=Xt*tt-dt;St[I]=qt*B,St[k]=Ct*U,St[G]=yt,c.push(St.x,St.y,St.z),St[I]=0,St[k]=0,St[G]=Y>0?1:-1,h.push(St.x,St.y,St.z),d.push(Xt/$),d.push(1-Et/q),wt+=1}}for(let Et=0;Et<q;Et++)for(let Ct=0;Ct<$;Ct++){let Xt=p+Ct+ot*Et,qt=p+Ct+ot*(Et+1),le=p+(Ct+1)+ot*(Et+1),Yt=p+(Ct+1)+ot*Et;a.push(Xt,qt,Yt),a.push(qt,le,Yt),Dt+=6}l.addGroup(g,Dt,Q),g+=Dt,p+=wt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new o(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Ni=class o extends pe{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};let s=[],r=[];l(i),c(n),h(),this.setAttribute("position",new Gt(s,3)),this.setAttribute("normal",new Gt(s.slice(),3)),this.setAttribute("uv",new Gt(r,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function l(B){let U=new A,N=new A,X=new A;for(let Y=0;Y<e.length;Y+=3)g(e[Y+0],U),g(e[Y+1],N),g(e[Y+2],X),a(U,N,X,B)}function a(B,U,N,X){let Y=X+1,$=[];for(let q=0;q<=Y;q++){$[q]=[];let Q=B.clone().lerp(N,q/Y),tt=U.clone().lerp(N,q/Y),it=Y-q;for(let dt=0;dt<=it;dt++)dt===0&&q===Y?$[q][dt]=Q:$[q][dt]=Q.clone().lerp(tt,dt/it)}for(let q=0;q<Y;q++)for(let Q=0;Q<2*(Y-q)-1;Q++){let tt=Math.floor(Q/2);Q%2===0?(p($[q][tt+1]),p($[q+1][tt]),p($[q][tt])):(p($[q][tt+1]),p($[q+1][tt+1]),p($[q+1][tt]))}}function c(B){let U=new A;for(let N=0;N<s.length;N+=3)U.x=s[N+0],U.y=s[N+1],U.z=s[N+2],U.normalize().multiplyScalar(B),s[N+0]=U.x,s[N+1]=U.y,s[N+2]=U.z}function h(){let B=new A;for(let U=0;U<s.length;U+=3){B.x=s[U+0],B.y=s[U+1],B.z=s[U+2];let N=k(B)/2/Math.PI+.5,X=G(B)/Math.PI+.5;r.push(N,1-X)}M(),d()}function d(){for(let B=0;B<r.length;B+=6){let U=r[B+0],N=r[B+2],X=r[B+4],Y=Math.max(U,N,X),$=Math.min(U,N,X);Y>.9&&$<.1&&(U<.2&&(r[B+0]+=1),N<.2&&(r[B+2]+=1),X<.2&&(r[B+4]+=1))}}function p(B){s.push(B.x,B.y,B.z)}function g(B,U){let N=B*3;U.x=t[N+0],U.y=t[N+1],U.z=t[N+2]}function M(){let B=new A,U=new A,N=new A,X=new A,Y=new bt,$=new bt,q=new bt;for(let Q=0,tt=0;Q<s.length;Q+=9,tt+=6){B.set(s[Q+0],s[Q+1],s[Q+2]),U.set(s[Q+3],s[Q+4],s[Q+5]),N.set(s[Q+6],s[Q+7],s[Q+8]),Y.set(r[tt+0],r[tt+1]),$.set(r[tt+2],r[tt+3]),q.set(r[tt+4],r[tt+5]),X.copy(B).add(U).add(N).divideScalar(3);let it=k(X);I(Y,tt+0,B,it),I($,tt+2,U,it),I(q,tt+4,N,it)}}function I(B,U,N,X){X<0&&B.x===1&&(r[U]=B.x-1),N.x===0&&N.z===0&&(r[U]=X/2/Math.PI+.5)}function k(B){return Math.atan2(B.z,-B.x)}function G(B){return Math.atan2(-B.y,Math.sqrt(B.x*B.x+B.z*B.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new o(t.vertices,t.indices,t.radius,t.detail)}};function za(o,t,e=2){let n=t&&t.length,i=n?t[0]*e:o.length,s=$r(o,0,i,e,!0),r=[];if(!s||s.next===s.prev)return r;let l,a,c;if(n&&(s=Wa(o,t,s,e)),o.length>80*e){l=o[0],a=o[1];let h=l,d=a;for(let p=e;p<i;p+=e){let g=o[p],M=o[p+1];g<l&&(l=g),M<a&&(a=M),g>h&&(h=g),M>d&&(d=M)}c=Math.max(h-l,d-a),c=c!==0?32767/c:0}return Hn(s,r,e,l,a,c,0),r}function $r(o,t,e,n,i){let s;if(i===eo(o,t,e,n)>0)for(let r=t;r<e;r+=n)s=Ar(r/n|0,o[r],o[r+1],s);else for(let r=e-n;r>=t;r-=n)s=Ar(r/n|0,o[r],o[r+1],s);return s&&xn(s,s.next)&&(Wn(s),s=s.next),s}function Je(o,t){if(!o)return o;t||(t=o);let e=o,n;do if(n=!1,!e.steiner&&(xn(e,e.next)||Rt(e.prev,e,e.next)===0)){if(Wn(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Hn(o,t,e,n,i,s,r){if(!o)return;!r&&s&&Ja(o,n,i,s);let l=o;for(;o.prev!==o.next;){let a=o.prev,c=o.next;if(s?Va(o,n,i,s):ka(o)){t.push(a.i,o.i,c.i),Wn(o),o=c.next,l=c.next;continue}if(o=c,o===l){r?r===1?(o=Ha(Je(o),t),Hn(o,t,e,n,i,s,2)):r===2&&Ga(o,t,e,n,i,s):Hn(Je(o),t,e,n,i,s,1);break}}}function ka(o){let t=o.prev,e=o,n=o.next;if(Rt(t,e,n)>=0)return!1;let i=t.x,s=e.x,r=n.x,l=t.y,a=e.y,c=n.y,h=Math.min(i,s,r),d=Math.min(l,a,c),p=Math.max(i,s,r),g=Math.max(l,a,c),M=n.next;for(;M!==t;){if(M.x>=h&&M.x<=p&&M.y>=d&&M.y<=g&&Nn(i,l,s,a,r,c,M.x,M.y)&&Rt(M.prev,M,M.next)>=0)return!1;M=M.next}return!0}function Va(o,t,e,n){let i=o.prev,s=o,r=o.next;if(Rt(i,s,r)>=0)return!1;let l=i.x,a=s.x,c=r.x,h=i.y,d=s.y,p=r.y,g=Math.min(l,a,c),M=Math.min(h,d,p),I=Math.max(l,a,c),k=Math.max(h,d,p),G=Gs(g,M,t,e,n),B=Gs(I,k,t,e,n),U=o.prevZ,N=o.nextZ;for(;U&&U.z>=G&&N&&N.z<=B;){if(U.x>=g&&U.x<=I&&U.y>=M&&U.y<=k&&U!==i&&U!==r&&Nn(l,h,a,d,c,p,U.x,U.y)&&Rt(U.prev,U,U.next)>=0||(U=U.prevZ,N.x>=g&&N.x<=I&&N.y>=M&&N.y<=k&&N!==i&&N!==r&&Nn(l,h,a,d,c,p,N.x,N.y)&&Rt(N.prev,N,N.next)>=0))return!1;N=N.nextZ}for(;U&&U.z>=G;){if(U.x>=g&&U.x<=I&&U.y>=M&&U.y<=k&&U!==i&&U!==r&&Nn(l,h,a,d,c,p,U.x,U.y)&&Rt(U.prev,U,U.next)>=0)return!1;U=U.prevZ}for(;N&&N.z<=B;){if(N.x>=g&&N.x<=I&&N.y>=M&&N.y<=k&&N!==i&&N!==r&&Nn(l,h,a,d,c,p,N.x,N.y)&&Rt(N.prev,N,N.next)>=0)return!1;N=N.nextZ}return!0}function Ha(o,t){let e=o;do{let n=e.prev,i=e.next.next;!xn(n,i)&&jr(n,e,e.next,i)&&Gn(n,i)&&Gn(i,n)&&(t.push(n.i,e.i,i.i),Wn(e),Wn(e.next),e=o=i),e=e.next}while(e!==o);return Je(e)}function Ga(o,t,e,n,i,s){let r=o;do{let l=r.next.next;for(;l!==r.prev;){if(r.i!==l.i&&ja(r,l)){let a=Qr(r,l);r=Je(r,r.next),a=Je(a,a.next),Hn(r,t,e,n,i,s,0),Hn(a,t,e,n,i,s,0);return}l=l.next}r=r.next}while(r!==o)}function Wa(o,t,e,n){let i=[];for(let s=0,r=t.length;s<r;s++){let l=t[s]*n,a=s<r-1?t[s+1]*n:o.length,c=$r(o,l,a,n,!1);c===c.next&&(c.steiner=!0),i.push(Ka(c))}i.sort(Xa);for(let s=0;s<i.length;s++)e=qa(i[s],e);return e}function Xa(o,t){let e=o.x-t.x;if(e===0&&(e=o.y-t.y,e===0)){let n=(o.next.y-o.y)/(o.next.x-o.x),i=(t.next.y-t.y)/(t.next.x-t.x);e=n-i}return e}function qa(o,t){let e=Ya(o,t);if(!e)return t;let n=Qr(e,o);return Je(n,n.next),Je(e,e.next)}function Ya(o,t){let e=t,n=o.x,i=o.y,s=-1/0,r;if(xn(o,e))return e;do{if(xn(o,e.next))return e.next;if(i<=e.y&&i>=e.next.y&&e.next.y!==e.y){let d=e.x+(i-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=n&&d>s&&(s=d,r=e.x<e.next.x?e:e.next,d===n))return r}e=e.next}while(e!==t);if(!r)return null;let l=r,a=r.x,c=r.y,h=1/0;e=r;do{if(n>=e.x&&e.x>=a&&n!==e.x&&Kr(i<c?n:s,i,a,c,i<c?s:n,i,e.x,e.y)){let d=Math.abs(i-e.y)/(n-e.x);Gn(e,o)&&(d<h||d===h&&(e.x>r.x||e.x===r.x&&Za(r,e)))&&(r=e,h=d)}e=e.next}while(e!==l);return r}function Za(o,t){return Rt(o.prev,o,t.prev)<0&&Rt(t.next,o,o.next)<0}function Ja(o,t,e,n){let i=o;do i.z===0&&(i.z=Gs(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==o);i.prevZ.nextZ=null,i.prevZ=null,$a(i)}function $a(o){let t,e=1;do{let n=o,i;o=null;let s=null;for(t=0;n;){t++;let r=n,l=0;for(let c=0;c<e&&(l++,r=r.nextZ,!!r);c++);let a=e;for(;l>0||a>0&&r;)l!==0&&(a===0||!r||n.z<=r.z)?(i=n,n=n.nextZ,l--):(i=r,r=r.nextZ,a--),s?s.nextZ=i:o=i,i.prevZ=s,s=i;n=r}s.nextZ=null,e*=2}while(t>1);return o}function Gs(o,t,e,n,i){return o=(o-e)*i|0,t=(t-n)*i|0,o=(o|o<<8)&16711935,o=(o|o<<4)&252645135,o=(o|o<<2)&858993459,o=(o|o<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,o|t<<1}function Ka(o){let t=o,e=o;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==o);return e}function Kr(o,t,e,n,i,s,r,l){return(i-r)*(t-l)>=(o-r)*(s-l)&&(o-r)*(n-l)>=(e-r)*(t-l)&&(e-r)*(s-l)>=(i-r)*(n-l)}function Nn(o,t,e,n,i,s,r,l){return!(o===r&&t===l)&&Kr(o,t,e,n,i,s,r,l)}function ja(o,t){return o.next.i!==t.i&&o.prev.i!==t.i&&!Qa(o,t)&&(Gn(o,t)&&Gn(t,o)&&to(o,t)&&(Rt(o.prev,o,t.prev)||Rt(o,t.prev,t))||xn(o,t)&&Rt(o.prev,o,o.next)>0&&Rt(t.prev,t,t.next)>0)}function Rt(o,t,e){return(t.y-o.y)*(e.x-t.x)-(t.x-o.x)*(e.y-t.y)}function xn(o,t){return o.x===t.x&&o.y===t.y}function jr(o,t,e,n){let i=yi(Rt(o,t,e)),s=yi(Rt(o,t,n)),r=yi(Rt(e,n,o)),l=yi(Rt(e,n,t));return!!(i!==s&&r!==l||i===0&&xi(o,e,t)||s===0&&xi(o,n,t)||r===0&&xi(e,o,n)||l===0&&xi(e,t,n))}function xi(o,t,e){return t.x<=Math.max(o.x,e.x)&&t.x>=Math.min(o.x,e.x)&&t.y<=Math.max(o.y,e.y)&&t.y>=Math.min(o.y,e.y)}function yi(o){return o>0?1:o<0?-1:0}function Qa(o,t){let e=o;do{if(e.i!==o.i&&e.next.i!==o.i&&e.i!==t.i&&e.next.i!==t.i&&jr(e,e.next,o,t))return!0;e=e.next}while(e!==o);return!1}function Gn(o,t){return Rt(o.prev,o,o.next)<0?Rt(o,t,o.next)>=0&&Rt(o,o.prev,t)>=0:Rt(o,t,o.prev)<0||Rt(o,o.next,t)<0}function to(o,t){let e=o,n=!1,i=(o.x+t.x)/2,s=(o.y+t.y)/2;do e.y>s!=e.next.y>s&&e.next.y!==e.y&&i<(e.next.x-e.x)*(s-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==o);return n}function Qr(o,t){let e=Ws(o.i,o.x,o.y),n=Ws(t.i,t.x,t.y),i=o.next,s=t.prev;return o.next=t,t.prev=o,e.next=i,i.prev=e,n.next=e,e.prev=n,s.next=n,n.prev=s,n}function Ar(o,t,e,n){let i=Ws(o,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Wn(o){o.next.prev=o.prev,o.prev.next=o.next,o.prevZ&&(o.prevZ.nextZ=o.nextZ),o.nextZ&&(o.nextZ.prevZ=o.prevZ)}function Ws(o,t,e){return{i:o,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function eo(o,t,e,n){let i=0;for(let s=t,r=e-n;s<e;s+=n)i+=(o[r]-o[s])*(o[s+1]+o[r+1]),r=s;return i}var Xs=class{static triangulate(t,e,n=2){return za(t,e,n)}},yn=class o{static area(t){let e=t.length,n=0;for(let i=e-1,s=0;s<e;i=s++)n+=t[i].x*t[s].y-t[s].x*t[i].y;return n*.5}static isClockWise(t){return o.area(t)<0}static triangulateShape(t,e){let n=[],i=[],s=[];Rr(t),Cr(n,t);let r=t.length;e.forEach(Rr);for(let a=0;a<e.length;a++)i.push(r),r+=e[a].length,Cr(n,e[a]);let l=Xs.triangulate(n,i);for(let a=0;a<l.length;a+=3)s.push(l.slice(a,a+3));return s}};function Rr(o){let t=o.length;t>2&&o[t-1].equals(o[0])&&o.pop()}function Cr(o,t){for(let e=0;e<t.length;e++)o.push(t[e].x),o.push(t[e].y)}var Xn=class o extends Ni{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new o(t.radius,t.detail)}};function ta(o){let t={};for(let e in o){t[e]={};for(let n in o[e]){let i=o[e][n];if(Ir(i))i.isRenderTargetTexture?(Ut("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(Ir(i[0])){let s=[];for(let r=0,l=i.length;r<l;r++)s[r]=i[r].clone();t[e][n]=s}else t[e][n]=i.slice();else t[e][n]=i}}return t}function Wt(o){let t={};for(let e=0;e<o.length;e++){let n=ta(o[e]);for(let i in n)t[i]=n[i]}return t}function Ir(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}var Ui=class extends Bn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ut(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xr,this.normalScale=new bt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ze,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},qn=class extends Ui{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new bt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ht(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ut(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ut(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ut(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};function dn(o,t){return!o||o.constructor===t?o:typeof t.BYTES_PER_ELEMENT=="number"?new t(o):Array.prototype.slice.call(o)}function Ts(o){return o!==void 0&&o.inTangents!==void 0&&o.outTangents!==void 0}var Oe=class{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,i=e[n],s=e[n-1];n:{t:{let r;e:{i:if(!(t<i)){for(let l=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===l)break;if(s=i,i=e[++n],t<i)break t}r=e.length;break e}if(!(t>=s)){let l=e[1];t<l&&(n=2,s=l);for(let a=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=s,s=e[--n-1],t>=s)break t}r=n,n=0;break e}break n}for(;n<r;){let l=n+r>>>1;t<e[l]?r=l:n=l+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let r=0;r!==i;++r)e[r]=n[s+r];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Fi=class extends Oe{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fs,endingEnd:Fs}}intervalChanged_(t,e,n){let i=this.parameterPositions,s=t-2,r=t+1,l=i[s],a=i[r];if(l===void 0)switch(this.getSettings_().endingStart){case Os:s=t,l=2*e-n;break;case Bs:s=i.length-2,l=e+i[s]-i[s+1];break;default:s=t,l=n}if(a===void 0)switch(this.getSettings_().endingEnd){case Os:r=t,a=2*n-e;break;case Bs:r=1,a=n+i[1]-i[0];break;default:r=t-1,a=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-l),this._weightNext=c/(a-n),this._offsetPrev=s*h,this._offsetNext=r*h}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=t*l,c=a-l,h=this._offsetPrev,d=this._offsetNext,p=this._weightPrev,g=this._weightNext,M=(n-e)/(i-e),I=M*M,k=I*M,G=-p*k+2*p*I-p*M,B=(1+p)*k+(-1.5-2*p)*I+(-.5+p)*M+1,U=(-1-g)*k+(1.5+g)*I+.5*M,N=g*k-g*I;for(let X=0;X!==l;++X)s[X]=G*r[h+X]+B*r[c+X]+U*r[a+X]+N*r[d+X];return s}},Oi=class extends Oe{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=t*l,c=a-l,h=(n-e)/(i-e),d=1-h;for(let p=0;p!==l;++p)s[p]=r[c+p]*d+r[a+p]*h;return s}},Bi=class extends Oe{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}},zi=class extends Oe{interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=t*l,c=a-l,h=this.inTangents,d=this.outTangents;if(!h||!d){let M=(n-e)/(i-e),I=1-M;for(let k=0;k!==l;++k)s[k]=r[c+k]*I+r[a+k]*M;return s}let p=l*2,g=t-1;for(let M=0;M!==l;++M){let I=r[c+M],k=r[a+M],G=g*p+M*2,B=d[G],U=d[G+1],N=t*p+M*2,X=h[N],Y=h[N+1],$=io(n,e,B,X,i);s[M]=ea($,I,U,Y,k)}return s}};function ea(o,t,e,n,i){let s=1-o;return s*s*s*t+3*s*s*o*e+3*s*o*o*n+o*o*o*i}function no(o,t,e,n,i){let s=1-o;return 3*s*s*(e-t)+6*s*o*(n-e)+3*o*o*(i-n)}function io(o,t,e,n,i){let s=(o-t)/(i-t);for(let r=0;r<8;r++){let l=ea(s,t,e,n,i)-o;if(Math.abs(l)<1e-10)break;let a=no(s,t,e,n,i);if(Math.abs(a)<1e-10)break;s=Math.max(0,Math.min(1,s-l/a))}return s}var se=class{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=dn(e,this.TimeBufferType),this.values=dn(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:dn(t.times,Array),values:dn(t.values,Array)};let i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i),Ts(t.settings)&&(n.settings={inTangents:dn(t.settings.inTangents,Array),outTangents:dn(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Bi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Oi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Fi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new zi(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Fn:e=this.InterpolantFactoryMethodDiscrete;break;case Ei:e=this.InterpolantFactoryMethodLinear;break;case vi:e=this.InterpolantFactoryMethodSmooth;break;case Us:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ut("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Fn;case this.InterpolantFactoryMethodLinear:return Ei;case this.InterpolantFactoryMethodSmooth:return vi;case this.InterpolantFactoryMethodBezier:return Us}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t;Ts(this.settings)&&(Pr(this.settings.inTangents,t),Pr(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,i=n.length,s=0,r=i-1;for(;s!==i&&n[s]<t;)++s;for(;r!==-1&&n[r]>e;)--r;if(++r,s!==0||r!==i){s>=r&&(r=Math.max(r,1),s=r-1);let l=this.getValueSize();this.times=n.slice(s,r),this.values=this.values.slice(s*l,r*l)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(At("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,i=this.values,s=n.length;s===0&&(At("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let l=0;l!==s;l++){let a=n[l];if(typeof a=="number"&&isNaN(a)){At("KeyframeTrack: Time is not a valid number.",this,l,a),t=!1;break}if(r!==null&&r>a){At("KeyframeTrack: Out of order keys.",this,l,a,r),t=!1;break}r=a}if(i!==void 0&&ya(i))for(let l=0,a=i.length;l!==a;++l){let c=i[l];if(isNaN(c)){At("KeyframeTrack: Value is not a valid number.",this,l,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===vi,s=t.length-1,r=1;for(let l=1;l<s;++l){let a=!1,c=t[l],h=t[l+1];if(c!==h&&(l!==1||c!==t[0]))if(i)a=!0;else{let d=l*n,p=d-n,g=d+n;for(let M=0;M!==n;++M){let I=e[d+M];if(I!==e[p+M]||I!==e[g+M]){a=!0;break}}}if(a){if(l!==r){t[r]=t[l];let d=l*n,p=r*n;for(let g=0;g!==n;++g)e[p+g]=e[d+g]}++r}}if(s>0){t[r]=t[s];for(let l=s*n,a=r*n,c=0;c!==n;++c)e[a+c]=e[l+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=e.slice(0,r*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,Ts(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function Pr(o,t){for(let e=0,n=o.length;e!==n;e+=2)o[e]*=t}se.prototype.ValueTypeName="";se.prototype.TimeBufferType=Float32Array;se.prototype.ValueBufferType=Float32Array;se.prototype.DefaultInterpolation=Ei;var Be=class extends se{constructor(t,e,n){super(t,e,n)}};Be.prototype.ValueTypeName="bool";Be.prototype.ValueBufferType=Array;Be.prototype.DefaultInterpolation=Fn;Be.prototype.InterpolantFactoryMethodLinear=void 0;Be.prototype.InterpolantFactoryMethodSmooth=void 0;var ki=class extends se{constructor(t,e,n,i){super(t,e,n,i)}};ki.prototype.ValueTypeName="color";var Vi=class extends se{constructor(t,e,n,i){super(t,e,n,i)}};Vi.prototype.ValueTypeName="number";var Hi=class extends Oe{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,l=this.valueSize,a=(n-e)/(i-e),c=t*l;for(let h=c+l;c!==h;c+=4)Te.slerpFlat(s,0,r,c-l,r,c,a);return s}},Yn=class extends se{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new Hi(this.times,this.values,this.getValueSize(),t)}};Yn.prototype.ValueTypeName="quaternion";Yn.prototype.InterpolantFactoryMethodSmooth=void 0;var ze=class extends se{constructor(t,e,n){super(t,e,n)}};ze.prototype.ValueTypeName="string";ze.prototype.ValueBufferType=Array;ze.prototype.DefaultInterpolation=Fn;ze.prototype.InterpolantFactoryMethodLinear=void 0;ze.prototype.InterpolantFactoryMethodSmooth=void 0;var Gi=class extends se{constructor(t,e,n,i){super(t,e,n,i)}};Gi.prototype.ValueTypeName="vector";var Wi=class{constructor(t,e,n){let i=this,s=!1,r=0,l=0,a,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){l++,s===!1&&i.onStart!==void 0&&i.onStart(h,r,l),s=!0},this.itemEnd=function(h){r++,i.onProgress!==void 0&&i.onProgress(h,r,l),r===l&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),a?a(h):h},this.setURLModifier=function(h){return a=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,p=c.length;d<p;d+=2){let g=c[d],M=c[d+1];if(g.global&&(g.lastIndex=0),g.test(h))return M}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},na=new Wi,Xi=class{constructor(t){this.manager=t!==void 0?t:na,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Xi.DEFAULT_MATERIAL_NAME="__DEFAULT";var ar="\\[\\]\\.:\\/",so=new RegExp("["+ar+"]","g"),or="[^"+ar+"]",ro="[^"+ar.replace("\\.","")+"]",ao=/((?:WC+[\/:])*)/.source.replace("WC",or),oo=/(WCOD+)?/.source.replace("WCOD",ro),lo=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",or),co=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",or),ho=new RegExp("^"+ao+oo+lo+co+"$"),uo=["material","materials","bones","map"],qs=class{constructor(t,e,n){let i=n||Tt.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Tt=class o{constructor(t,e,n){this.path=e,this.parsedPath=n||o.parseTrackName(e),this.node=o.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new o.Composite(t,e,n):new o(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(so,"")}static parseTrackName(t){let e=ho.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);uo.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(s){for(let r=0;r<s.length;r++){let l=s[r];if(l.name===e||l.uuid===e)return l;let a=n(l.children);if(a)return a}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,i=e.propertyName,s=e.propertyIndex;if(t||(t=o.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Ut("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){At("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){At("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){At("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){At("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){At("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){At("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){At("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[i];if(r===void 0){let c=e.nodeName;At("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",t);return}let l=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?l=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(l=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){At("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){At("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}a=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=s}else r.fromArray!==void 0&&r.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(a=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][l]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Tt.Composite=qs;Tt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Tt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Tt.prototype.GetterByBindingType=[Tt.prototype._getValue_direct,Tt.prototype._getValue_array,Tt.prototype._getValue_arrayElement,Tt.prototype._getValue_toArray];Tt.prototype.SetterByBindingTypeAndVersioning=[[Tt.prototype._setValue_direct,Tt.prototype._setValue_direct_setNeedsUpdate,Tt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Tt.prototype._setValue_array,Tt.prototype._setValue_array_setNeedsUpdate,Tt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Tt.prototype._setValue_arrayElement,Tt.prototype._setValue_arrayElement_setNeedsUpdate,Tt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Tt.prototype._setValue_fromArray,Tt.prototype._setValue_fromArray_setNeedsUpdate,Tt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var dh=new Float32Array(1);var Ys=class o{static{o.prototype.isMatrix2=!0}constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){let s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=i,this}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ut("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");var yo=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,vo=`#ifdef USE_ALPHAHASH
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
#endif`,Mo=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,bo=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,So=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Eo=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,To=`#ifdef USE_AOMAP
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
#endif`,wo=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ao=`#ifdef USE_BATCHING
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
#endif`,Ro=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Co=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Io=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Po=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Lo=`#ifdef USE_IRIDESCENCE
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
#endif`,Do=`#ifdef USE_BUMPMAP
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
#endif`,No=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Uo=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Fo=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Oo=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Bo=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,zo=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,ko=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Vo=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Ho=`#define PI 3.141592653589793
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
} // validated`,Go=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Wo=`vec3 transformedNormal = objectNormal;
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
#endif`,Xo=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,qo=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Yo=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Zo=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Jo="gl_FragColor = linearToOutputTexel( gl_FragColor );",$o=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ko=`#ifdef USE_ENVMAP
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
#endif`,jo=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Qo=`#ifdef USE_ENVMAP
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
#endif`,tl=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,el=`#ifdef USE_ENVMAP
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
#endif`,nl=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,il=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,sl=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,rl=`#ifdef USE_FOG
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
}`,ol=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ll=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,cl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,hl=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,ul=`#ifdef USE_ENVMAP
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
#endif`,fl=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,dl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,pl=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ml=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,gl=`PhysicalMaterial material;
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
#endif`,_l=`uniform sampler2D dfgLUT;
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
}`,xl=`
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
#endif`,yl=`#if defined( RE_IndirectDiffuse )
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
#endif`,vl=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ml=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,bl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Sl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,El=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Tl=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,wl=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Al=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Rl=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Cl=`#if defined( USE_POINTS_UV )
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
#endif`,Il=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Pl=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ll=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Dl=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Nl=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ul=`#ifdef USE_MORPHTARGETS
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
#endif`,Fl=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ol=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Bl=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,zl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,kl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vl=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Hl=`#ifdef USE_NORMALMAP
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
#endif`,Gl=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Wl=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Xl=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ql=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Yl=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Zl=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Jl=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,$l=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Kl=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,jl=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ql=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tc=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ec=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,nc=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,ic=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,sc=`float getShadowMask() {
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
}`,rc=`#ifdef USE_SKINNING
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
#endif`,oc=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,lc=`#ifdef USE_SKINNING
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
#endif`,cc=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,hc=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,uc=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,fc=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,dc=`#ifdef USE_TRANSMISSION
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
#endif`,pc=`#ifdef USE_TRANSMISSION
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
#endif`,mc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,gc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,_c=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,xc=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,yc=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,vc=`uniform sampler2D t2D;
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
}`,Mc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bc=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Sc=`varying vec3 vWorldDirection;
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
}`,wc=`#if DEPTH_PACKING == 3200
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
}`,Ac=`#define DISTANCE
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
}`,Rc=`#define DISTANCE
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
}`,Cc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ic=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pc=`uniform float scale;
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
}`,Lc=`uniform vec3 diffuse;
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
}`,Dc=`#include <common>
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
}`,Nc=`uniform vec3 diffuse;
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
}`,Uc=`#define LAMBERT
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
}`,Fc=`#define LAMBERT
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
}`,Oc=`#define MATCAP
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
}`,Bc=`#define MATCAP
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
}`,zc=`#define NORMAL
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
}`,kc=`#define NORMAL
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
}`,Vc=`#define PHONG
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
}`,Hc=`#define PHONG
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
}`,Gc=`#define STANDARD
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
}`,Wc=`#define STANDARD
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
}`,Xc=`#define TOON
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
}`,qc=`#define TOON
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
}`,Yc=`uniform float size;
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
}`,Zc=`uniform vec3 diffuse;
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
}`,Jc=`#include <common>
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
}`,$c=`uniform vec3 color;
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
}`,Kc=`uniform float rotation;
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
}`,ft={alphahash_fragment:yo,alphahash_pars_fragment:vo,alphamap_fragment:Mo,alphamap_pars_fragment:bo,alphatest_fragment:So,alphatest_pars_fragment:Eo,aomap_fragment:To,aomap_pars_fragment:wo,batching_pars_vertex:Ao,batching_vertex:Ro,begin_vertex:Co,beginnormal_vertex:Io,bsdfs:Po,iridescence_fragment:Lo,bumpmap_pars_fragment:Do,clipping_planes_fragment:No,clipping_planes_pars_fragment:Uo,clipping_planes_pars_vertex:Fo,clipping_planes_vertex:Oo,color_fragment:Bo,color_pars_fragment:zo,color_pars_vertex:ko,color_vertex:Vo,common:Ho,cube_uv_reflection_fragment:Go,defaultnormal_vertex:Wo,displacementmap_pars_vertex:Xo,displacementmap_vertex:qo,emissivemap_fragment:Yo,emissivemap_pars_fragment:Zo,colorspace_fragment:Jo,colorspace_pars_fragment:$o,envmap_fragment:Ko,envmap_common_pars_fragment:jo,envmap_pars_fragment:Qo,envmap_pars_vertex:tl,envmap_physical_pars_fragment:ul,envmap_vertex:el,fog_vertex:nl,fog_pars_vertex:il,fog_fragment:sl,fog_pars_fragment:rl,gradientmap_pars_fragment:al,lightmap_pars_fragment:ol,lights_lambert_fragment:ll,lights_lambert_pars_fragment:cl,lights_pars_begin:hl,lights_toon_fragment:fl,lights_toon_pars_fragment:dl,lights_phong_fragment:pl,lights_phong_pars_fragment:ml,lights_physical_fragment:gl,lights_physical_pars_fragment:_l,lights_fragment_begin:xl,lights_fragment_maps:yl,lights_fragment_end:vl,lightprobes_pars_fragment:Ml,logdepthbuf_fragment:bl,logdepthbuf_pars_fragment:Sl,logdepthbuf_pars_vertex:El,logdepthbuf_vertex:Tl,map_fragment:wl,map_pars_fragment:Al,map_particle_fragment:Rl,map_particle_pars_fragment:Cl,metalnessmap_fragment:Il,metalnessmap_pars_fragment:Pl,morphinstance_vertex:Ll,morphcolor_vertex:Dl,morphnormal_vertex:Nl,morphtarget_pars_vertex:Ul,morphtarget_vertex:Fl,normal_fragment_begin:Ol,normal_fragment_maps:Bl,normal_pars_fragment:zl,normal_pars_vertex:kl,normal_vertex:Vl,normalmap_pars_fragment:Hl,clearcoat_normal_fragment_begin:Gl,clearcoat_normal_fragment_maps:Wl,clearcoat_pars_fragment:Xl,iridescence_pars_fragment:ql,opaque_fragment:Yl,packing:Zl,premultiplied_alpha_fragment:Jl,project_vertex:$l,dithering_fragment:Kl,dithering_pars_fragment:jl,roughnessmap_fragment:Ql,roughnessmap_pars_fragment:tc,shadowmap_pars_fragment:ec,shadowmap_pars_vertex:nc,shadowmap_vertex:ic,shadowmask_pars_fragment:sc,skinbase_vertex:rc,skinning_pars_vertex:ac,skinning_vertex:oc,skinnormal_vertex:lc,specularmap_fragment:cc,specularmap_pars_fragment:hc,tonemapping_fragment:uc,tonemapping_pars_fragment:fc,transmission_fragment:dc,transmission_pars_fragment:pc,uv_pars_fragment:mc,uv_pars_vertex:gc,uv_vertex:_c,worldpos_vertex:xc,background_vert:yc,background_frag:vc,backgroundCube_vert:Mc,backgroundCube_frag:bc,cube_vert:Sc,cube_frag:Ec,depth_vert:Tc,depth_frag:wc,distance_vert:Ac,distance_frag:Rc,equirect_vert:Cc,equirect_frag:Ic,linedashed_vert:Pc,linedashed_frag:Lc,meshbasic_vert:Dc,meshbasic_frag:Nc,meshlambert_vert:Uc,meshlambert_frag:Fc,meshmatcap_vert:Oc,meshmatcap_frag:Bc,meshnormal_vert:zc,meshnormal_frag:kc,meshphong_vert:Vc,meshphong_frag:Hc,meshphysical_vert:Gc,meshphysical_frag:Wc,meshtoon_vert:Xc,meshtoon_frag:qc,points_vert:Yc,points_frag:Zc,shadow_vert:Jc,shadow_frag:$c,sprite_vert:Kc,sprite_frag:jc},J={common:{diffuse:{value:new ut(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new rt},alphaMap:{value:null},alphaMapTransform:{value:new rt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new rt}},envmap:{envMap:{value:null},envMapRotation:{value:new rt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new rt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new rt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new rt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new rt},normalScale:{value:new bt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new rt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new rt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new rt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new rt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ut(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new A},probesMax:{value:new A},probesResolution:{value:new A}},points:{diffuse:{value:new ut(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new rt},alphaTest:{value:0},uvTransform:{value:new rt}},sprite:{diffuse:{value:new ut(16777215)},opacity:{value:1},center:{value:new bt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new rt},alphaMap:{value:null},alphaMapTransform:{value:new rt},alphaTest:{value:0}}},ia={basic:{uniforms:Wt([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.fog]),vertexShader:ft.meshbasic_vert,fragmentShader:ft.meshbasic_frag},lambert:{uniforms:Wt([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.fog,J.lights,{emissive:{value:new ut(0)},envMapIntensity:{value:1}}]),vertexShader:ft.meshlambert_vert,fragmentShader:ft.meshlambert_frag},phong:{uniforms:Wt([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.fog,J.lights,{emissive:{value:new ut(0)},specular:{value:new ut(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ft.meshphong_vert,fragmentShader:ft.meshphong_frag},standard:{uniforms:Wt([J.common,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.roughnessmap,J.metalnessmap,J.fog,J.lights,{emissive:{value:new ut(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ft.meshphysical_vert,fragmentShader:ft.meshphysical_frag},toon:{uniforms:Wt([J.common,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.gradientmap,J.fog,J.lights,{emissive:{value:new ut(0)}}]),vertexShader:ft.meshtoon_vert,fragmentShader:ft.meshtoon_frag},matcap:{uniforms:Wt([J.common,J.bumpmap,J.normalmap,J.displacementmap,J.fog,{matcap:{value:null}}]),vertexShader:ft.meshmatcap_vert,fragmentShader:ft.meshmatcap_frag},points:{uniforms:Wt([J.points,J.fog]),vertexShader:ft.points_vert,fragmentShader:ft.points_frag},dashed:{uniforms:Wt([J.common,J.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ft.linedashed_vert,fragmentShader:ft.linedashed_frag},depth:{uniforms:Wt([J.common,J.displacementmap]),vertexShader:ft.depth_vert,fragmentShader:ft.depth_frag},normal:{uniforms:Wt([J.common,J.bumpmap,J.normalmap,J.displacementmap,{opacity:{value:1}}]),vertexShader:ft.meshnormal_vert,fragmentShader:ft.meshnormal_frag},sprite:{uniforms:Wt([J.sprite,J.fog]),vertexShader:ft.sprite_vert,fragmentShader:ft.sprite_frag},background:{uniforms:{uvTransform:{value:new rt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ft.background_vert,fragmentShader:ft.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new rt}},vertexShader:ft.backgroundCube_vert,fragmentShader:ft.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ft.cube_vert,fragmentShader:ft.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ft.equirect_vert,fragmentShader:ft.equirect_frag},distance:{uniforms:Wt([J.common,J.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ft.distance_vert,fragmentShader:ft.distance_frag},shadow:{uniforms:Wt([J.lights,J.fog,{color:{value:new ut(0)},opacity:{value:1}}]),vertexShader:ft.shadow_vert,fragmentShader:ft.shadow_frag}};ia.physical={uniforms:Wt([ia.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new rt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new rt},clearcoatNormalScale:{value:new bt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new rt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new rt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new rt},sheen:{value:0},sheenColor:{value:new ut(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new rt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new rt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new rt},transmissionSamplerSize:{value:new bt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new rt},attenuationDistance:{value:0},attenuationColor:{value:new ut(0)},specularColor:{value:new ut(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new rt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new rt},anisotropyVector:{value:new bt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new rt}}]),vertexShader:ft.meshphysical_vert,fragmentShader:ft.meshphysical_frag};var Qc=new rt;Qc.set(-1,0,0,0,1,0,0,0,1);var u0={[$s]:"LINEAR_TONE_MAPPING",[Ks]:"REINHARD_TONE_MAPPING",[js]:"CINEON_TONE_MAPPING",[Qs]:"ACES_FILMIC_TONE_MAPPING",[er]:"AGX_TONE_MAPPING",[nr]:"NEUTRAL_TONE_MAPPING",[tr]:"CUSTOM_TONE_MAPPING"};var f0=new Float32Array(16),d0=new Float32Array(9),p0=new Float32Array(4);var m0={[$s]:"Linear",[Ks]:"Reinhard",[js]:"Cineon",[Qs]:"ACESFilmic",[er]:"AgX",[nr]:"Neutral",[tr]:"Custom"};var g0={[Lr]:"SHADOWMAP_TYPE_PCF",[Dr]:"SHADOWMAP_TYPE_VSM"};var _0={[Vr]:"ENVMAP_TYPE_CUBE",[sr]:"ENVMAP_TYPE_CUBE",[Hr]:"ENVMAP_TYPE_CUBE_UV"};var x0={[sr]:"ENVMAP_MODE_REFRACTION"};var y0={[Js]:"ENVMAP_BLENDING_MULTIPLY",[zr]:"ENVMAP_BLENDING_MIX",[kr]:"ENVMAP_BLENDING_ADD"};var th=new rt;th.set(-1,0,0,0,1,0,0,0,1);var v0=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);function ra(o,t=!1){let e=o[0].index!==null,n=new Set(Object.keys(o[0].attributes)),i=new Set(Object.keys(o[0].morphAttributes)),s={},r={},l=o[0].morphTargetsRelative,a=new pe,c=0;for(let h=0;h<o.length;++h){let d=o[h],p=0;if(e!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let g in d.attributes){if(!n.has(g))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+g+'" attribute exists among all geometries, or in none of them.'),null;s[g]===void 0&&(s[g]=[]),s[g].push(d.attributes[g]),p++}if(p!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(l!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let g in d.morphAttributes){if(!i.has(g))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;r[g]===void 0&&(r[g]=[]),r[g].push(d.morphAttributes[g])}if(t){let g;if(e)g=d.index.count;else if(d.attributes.position!==void 0)g=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;a.addGroup(c,g,h),c+=g}}if(e){let h=0,d=[];for(let p=0;p<o.length;++p){let g=o[p].index;for(let M=0;M<g.count;++M)d.push(g.getX(M)+h);h+=o[p].attributes.position.count}a.setIndex(d)}for(let h in s){let d=sa(s[h]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;a.setAttribute(h,d)}for(let h in r){let d=r[h][0].length;if(d!==0){a.morphAttributes=a.morphAttributes||{},a.morphAttributes[h]=[];for(let p=0;p<d;++p){let g=[];for(let I=0;I<r[h].length;++I)g.push(r[h][I][p]);let M=sa(g);if(!M)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;a.morphAttributes[h].push(M)}}}return a}function sa(o){let t,e,n,i=-1,s=0;for(let c=0;c<o.length;++c){let h=o[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*e}let r=new t(s),l=new Ot(r,e,n),a=0;for(let c=0;c<o.length;++c){let h=o[c];if(h.isInterleavedBufferAttribute){let d=a/e;for(let p=0,g=h.count;p<g;p++)for(let M=0;M<e;M++){let I=h.getComponent(p,M);l.setComponent(p+d,M,I)}}else r.set(h.array,a);a+=h.count*e}return i!==void 0&&(l.gpuType=i),l}var nh=(()=>{let o={intensity:1,hemi:.12,exposure:1},t={wood:{describe:"timber with visible grain: oak, walnut, pine, plywood, bamboo; bark on a living or fallen tree; the cut end of a log or board",roughness:[.4,.62],metalness:0,tile:.6,size:1024,normal:.4,relief:.4,finishes:{oiled:{roughness:[.4,.62],clearcoat:.18,clearcoatRoughness:.45},lacquered:{roughness:[.3,.45],clearcoat:1,clearcoatRoughness:.08},raw:{roughness:[.66,.86]},bark:{roughness:[.8,.97],pattern:!0,normal:1.1,relief:.9,size:512},endgrain:{roughness:[.62,.82],pattern:!0,normal:.5,relief:.6,tile:.4,size:512}}},metal:{describe:"bare metal: brass, steel, iron, aluminium, copper, chrome",roughness:[.3,.42],metalness:1,tile:.25,size:512,normal:.18,finishes:{brushed:{roughness:[.28,.4],anisotropy:.85},polished:{roughness:[.08,.16]},satin:{roughness:[.42,.55],anisotropy:.3},cast:{roughness:[.55,.75]},rusted:{roughness:[.75,.95],metalness:.35}}},fabric:{describe:"woven or knitted cloth: upholstery, clothing, rugs, curtains, canvas, rope",roughness:[.86,.98],metalness:0,tile:.12,size:512,normal:.5,finishes:{linen:{roughness:[.86,.98],sheen:.45,sheenRoughness:.75},wool:{roughness:[.9,1],sheen:.7,sheenRoughness:.85},velvet:{roughness:[.94,1],sheen:1,sheenRoughness:.5},cotton:{roughness:[.86,.98],sheen:.35,sheenRoughness:.8},denim:{roughness:[.84,.96],sheen:.3,sheenRoughness:.8},canvas:{roughness:[.88,1],sheen:.2,sheenRoughness:.9},knit:{roughness:[.9,1],sheen:.7,sheenRoughness:.85}}},paint:{describe:"an opaque painted or plastered surface over anything: painted wood or metal, walls, lacquer",roughness:[.42,.58],metalness:0,tile:.6,size:256,normal:.3,relief:.3,finishes:{matte:{roughness:[.58,.74]},eggshell:{roughness:[.42,.58]},gloss:{roughness:[.12,.22],clearcoat:.6,clearcoatRoughness:.1}}},ceramic:{describe:"fired clay and porcelain: tiles, crockery, sanitaryware, glazed pots",roughness:[.16,.28],metalness:0,tile:.5,size:256,normal:.12,finishes:{glazed:{roughness:[.14,.24],clearcoat:.8,clearcoatRoughness:.06},matte:{roughness:[.5,.64]}}},leather:{describe:"leather, hide without hair, and bare animal skin such as a nose or paw pad",roughness:[.46,.64],metalness:0,tile:.25,size:512,normal:.7,finishes:{grain:{roughness:[.46,.64],sheen:.15,sheenRoughness:.6},patent:{roughness:[.1,.2],clearcoat:1,clearcoatRoughness:.05,relief:.12}}},rubber:{describe:"rubber and soft matte polymers: tyres, soles, gaskets, grips",roughness:[.7,.86],metalness:0,tile:.2,size:256,normal:.3,finishes:{black:{roughness:[.7,.86]}}},fur:{describe:"the coat of an animal: fur, hair, mane, feathers",roughness:[.7,.92],metalness:0,tile:.16,size:512,normal:.7,body:1.45,bodyClamp:[.18,1.35],finishes:{short:{roughness:[.72,.92],sheen:.6,sheenRoughness:.6},long:{roughness:[.68,.9],sheen:.8,sheenRoughness:.5},plush:{roughness:[.85,1],sheen:1,sheenRoughness:.8},sculpted:{roughness:[.55,.74],relief:.2,sheen:.45,sheenRoughness:.45,sheenWhite:.12}}},keratin:{describe:"hoof, claw, horn, beak, shell, bone, tooth",roughness:[.3,.48],metalness:0,tile:.1,size:256,normal:.25,finishes:{natural:{roughness:[.3,.48],clearcoat:.35,clearcoatRoughness:.3},polished:{roughness:[.12,.22],clearcoat:.9,clearcoatRoughness:.08}}},stone:{describe:"stone, rock, concrete, brick, plaster left rough, slate, marble",roughness:[.78,.96],metalness:0,tile:.45,size:512,normal:.85,finishes:{rough:{roughness:[.8,.97]},concrete:{roughness:[.7,.9]},polished:{roughness:[.12,.28],clearcoat:.5,clearcoatRoughness:.15}}},snow:{describe:"snow, frost, ice crust",roughness:[.8,1],metalness:0,tile:.35,size:256,normal:.45,finishes:{powder:{roughness:[.85,1],sheen:.5,sheenRoughness:.9},ice:{roughness:[.08,.2],clearcoat:.8,clearcoatRoughness:.1}}},foliage:{describe:"living plant matter: leaves, petals, grass, moss, stems, fruit skin; and the CUT-OUT finishes a card wears (spray, needles, grass)",roughness:[.45,.72],metalness:0,tile:.1,size:256,normal:.4,finishes:{leaf:{roughness:[.42,.68],sheen:.25,sheenRoughness:.5},petal:{roughness:[.55,.8],sheen:.5,sheenRoughness:.7},moss:{roughness:[.85,1],sheen:.6,sheenRoughness:.9},spray:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},needles:{roughness:[.72,.94],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},grass:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},core:{roughness:[.92,1],specular:.05,glance:.08,pattern:!0,size:256,tile:.3,normal:.5,crease:80,twoSided:!0}}},soil:{describe:"loose ground: soil, dirt, sand, gravel, mud, ash",roughness:[.88,1],metalness:0,tile:.3,size:512,normal:.9,finishes:{dry:{roughness:[.9,1]},wet:{roughness:[.35,.6]},sand:{roughness:[.85,.98]}}},glass:{describe:"glass and glossy screens, kept SOLID and tinted (never see-through): windows, bottles, lenses, monitor faces",roughness:[.03,.09],metalness:0,tile:.6,size:128,normal:.05,finishes:{clear:{roughness:[.03,.08],clearcoat:1,clearcoatRoughness:.03},frosted:{roughness:[.35,.55]}}},plastic:{describe:"moulded plastic, resin, vinyl, bakelite, acrylic",roughness:[.32,.5],metalness:0,tile:.4,size:256,normal:.15,relief:.3,finishes:{satin:{roughness:[.32,.5]},matte:{roughness:[.55,.72]},gloss:{roughness:[.06,.16],clearcoat:.6,clearcoatRoughness:.08},translucent:{roughness:[.03,.09],clearcoat:1,clearcoatRoughness:.04,transmission:.6,thickness:.012,ior:1.54}}},emissive:{describe:"something that GIVES light: flame, lamp shade when lit, bulb, screen glow, embers, neon",roughness:[.5,.7],metalness:0,tile:.4,size:128,normal:.05,finishes:{glow:{roughness:[.5,.7],emissive:1.4},flame:{roughness:[.6,.8],emissive:2.6,fire:!0,crease:80},screen:{roughness:[.1,.2],emissive:.9,clearcoat:.8,clearcoatRoughness:.05}}},skin:{describe:"bare skin: human skin (natural; soft for a stylised HD face), and the smooth wet skin of sharks, dolphins, whales, fish, eels, frogs and other water animals (wet)",roughness:[.48,.66],metalness:0,tile:.08,size:256,normal:.3,finishes:{natural:{roughness:[.48,.66],sheen:.25,sheenRoughness:.5},wet:{roughness:[.26,.4],relief:.12,clearcoat:.35,clearcoatRoughness:.3},soft:{roughness:[.5,.62],relief:.08,sheen:.18,sheenRoughness:.6}}},paper:{describe:"paper, card, books, cardboard, parchment",roughness:[.82,.96],metalness:0,tile:.2,size:256,normal:.35,relief:.5,finishes:{plain:{roughness:[.82,.96]},glossy:{roughness:[.25,.4]}}}},e=["kind","finish","describe","grain","crease","blend","intensity","must"],n={floor:750,perM2:2e3,exponent:.85,cap:5e4,overFlat:15};function i(m,y=null,u=null){let f=Math.max(0,Number(m?.x)||0),_=Math.max(0,Number(m?.y)||0),v=Math.max(0,Number(m?.z)||0),T=f*_+_*v+f*v,b=Number(u)>0?Math.min(T,Number(u)):T,x=Math.min(n.cap,n.floor+n.perM2*Math.pow(b,n.exponent));return Number(y)>0&&(x=Math.max(n.floor,Math.min(x,n.overFlat*Number(y)))),Math.round(x)}function s(m,y,u){let f=m*374761393+y*668265263+u*1442695041|0;return f=Math.imul(f^f>>>13,1274126177),f^=f>>>16,(f>>>0)/4294967296}let r=m=>m*m*(3-2*m);function l(m,y,u,f,_){let v=Math.floor(m),T=Math.floor(y),b=r(m-v),x=r(y-T),S=(v%u+u)%u,E=(T%f+f)%f,w=(S+1)%u,R=(E+1)%f,C=s(S,E,_),L=s(w,E,_),P=s(S,R,_),H=s(w,R,_);return C+(L-C)*b+(P+(H-P)*b-(C+(L-C)*b))*x}function a(m,y,u,f,_,v=4){let T=0,b=.5,x=0,S=u,E=f;for(let w=0;w<v;w++)T+=b*l(m*S,y*E,S,E,_+w*101),x+=b,b*=.5,S*=2,E*=2;return T/x}function c(m,y,u,f){let _=m*374761393+y*668265263+u*2246822519+f*1442695041|0;return _=Math.imul(_^_>>>13,1274126177),_^=_>>>16,(_>>>0)/4294967296}function h(m,y,u,f=1){let _=Math.floor(m),v=Math.floor(y),T=Math.floor(u),b=r(m-_),x=r(y-v),S=r(u-T),E=(R,C,L)=>c(_+R,v+C,T+L,f),w=(R,C,L)=>R+(C-R)*L;return w(w(w(E(0,0,0),E(1,0,0),b),w(E(0,1,0),E(1,1,0),b),x),w(w(E(0,0,1),E(1,0,1),b),w(E(0,1,1),E(1,1,1),b),x),S)}function d(m,y,u,f=1,_=3){let v=0,T=.5,b=0,x=1;for(let S=0;S<_;S++)v+=T*h(m*x,y*x,u*x,f+S*7),b+=T,T*=.5,x*=2;return v/b}let p={wood(m,y,u){let f=a(m,y,1,4,u+71)-.5,_=a(m,y,2,2,u)-.5,v=y*72+f*4+_*.6,T=.5+.5*Math.sin(2*Math.PI*v),b=.4+1.2*a(m,y,1,6,u+41),x=Math.pow(T,1.5+2.5*b),S=a(m,y,1,2,u+83)-.5,E=.5+.5*Math.sin(2*Math.PI*(y*7+_*1.4+S*.8)),w=Math.pow(E,1.6)*(.5+a(m,y,1,3,u+97)),R=a(m,y,3,128,u+13),C=a(m,y,8,256,u+29),L=a(m,y,1,1,u+3),P=Math.pow(a(m,y,16,3,u+57),6),H=.3*x+.25*w+.3*R+.15*C,O=1-.035*x-.075*w-.04*(R-.5)-.02*(C-.5)-.06*(L-.5)+.03*P,V=[1,1-.07*w-.03*x,1-.16*w-.06*x];return{h:H,L:O,T:V,r:.35*x+.3*w+.35*R}},"wood:bark"(m,y,u){let f=a(m,y,2,14,u+5,3),_=a(m,y,4,34,u+29,3),v=Math.abs(2*f-1),T=Math.abs(2*_-1),b=Math.max(0,1-v/.16),x=Math.max(0,1-T/.1),S=Math.max(b*b,.6*x*x),E=a(m,y,9,4,u+11,2),w=a(m,y,40,80,u+17,2),C=.55*Math.pow(Math.min(v/.6,1),.7)*(1-S)+.25*(E-.5)+.2*w,L=.98-.55*S+.14*(E-.5)+.06*(w-.5),P=[1,.95-.1*S,.86-.18*S];return{h:C,L,T:P,r:.45+.55*S+.1*(w-.5)}},"wood:endgrain"(m,y,u){let f=m-.5,_=y-.5,v=Math.hypot(f,_),T=Math.atan2(_,f),b=a(m,y,2,2,u+7)-.5,x=a(m,y,1,1,u+19)-.5,S=v*24+b*1.2+x*2.5,E=.5+.5*Math.sin(2*Math.PI*S),R=Math.pow(E,2.2)*(.5+.8*a(m,y,3,3,u+31,2)),C=Math.pow(Math.max(0,Math.cos(T*7+b*6)),40)*Math.min(1,v*3),L=a(m,y,40,40,u+23),P=.5*R+.3*L-.6*C,H=.93-.12*R-.04*(L-.5)-.3*C+.05*(v<.03?1:0),O=[1,.97-.05*R,.92-.1*R];return{h:P,L:H,T:O,r:.5+.4*R+.1*L}},"foliage:spray"(m,y,u){let f=null;for(let x=0;x<44;x++){let S=.4*Math.pow(s(x,1,u),.6),E=s(x,2,u)*Math.PI*2,w=.5+S*Math.cos(E),R=.5+S*Math.sin(E),C=s(x,3,u)*Math.PI,L=.075+.055*s(x,4,u),P=L*(.42+.2*s(x,5,u)),H=Math.cos(C),O=Math.sin(C),V=(m-w)*H+(y-R)*O,F=-(m-w)*O+(y-R)*H,D=V/L;if(Math.abs(D)>1)continue;let z=P*Math.sqrt(1-D*D)*(1-.28*(D+1)/2);Math.abs(F)<z&&(f={i:x,t:D,yn:F/z,w:z,y:F})}if(!f)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let _=.86+.26*s(f.i,6,u),v=Math.abs(f.y)<.045*f.w+.004?1:0,T=Math.pow(Math.abs(f.yn),1.5),b=_*(.98-.12*v+.06*T)*(1-.1*(f.t+1)/2);return{h:.5+.3*(1-Math.abs(f.yn))-.3*v,L:b,T:[1-.05*v,1,1-.08*T],r:.65-.2*v,a:1}},"foliage:needles"(m,y,u){let f=Math.abs(y-.5)<.006&&m>.06&&m<.9,_=null;for(let T=0;T<180;T++){let b=T%2?1:-1,x=.08+.82*s(T,1,u),S=b*(.95+.45*(s(T,2,u)-.5))-.35,E=Math.cos(S),w=Math.sin(S),R=.22+.16*s(T,3,u),C=.013;if(E>.001&&(R=Math.min(R,(.94-x)/E)),Math.abs(w)>.001&&(R=Math.min(R,.44/Math.abs(w))),R<.03)continue;let L=(m-x)*E+(y-.5)*w,P=-(m-x)*w+(y-.5)*E;L<0||L>R||Math.abs(P)>C*(1-.6*L/R)||(_={i:T,t:L/R,yn:P/C})}if(f&&!_)return{h:.6,L:.7,T:[1,.9,.8],r:.8,a:1};if(!_)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let v=.8+.28*s(_.i,4,u);return{h:.5+.3*(1-Math.abs(_.yn)),L:v*(.9+.1*_.t),T:[1,1,1],r:.6,a:1}},"foliage:core"(m,y,u){let f=null;for(let v=0;v<90;v++){let T=s(v,1,u),b=s(v,2,u),x=(m-T+1.5)%1-.5,S=(y-b+1.5)%1-.5,E=s(v,3,u)*Math.PI,w=.09+.06*s(v,4,u),R=w*.45,C=Math.cos(E),L=Math.sin(E),P=x*C+S*L,H=-x*L+S*C,O=P/w;if(Math.abs(O)>1)continue;let V=R*Math.sqrt(1-O*O);Math.abs(H)<V&&(f={i:v,t:O,yn:H/V})}if(!f)return{h:.3,L:.45,T:[1,1,1],r:.9,a:1};let _=.55+.35*s(f.i,6,u);return{h:.5+.3*(1-Math.abs(f.yn)),L:_*(.92+.06*f.t),T:[1,1,1],r:.7,a:1}},"foliage:grass"(m,y,u){let f=null;for(let v=0;v<17;v++){let T=.28+.44*s(v,1,u),b=(s(v,2,u)-.5)*.8,x=.5+.45*s(v,3,u),S=y/x;if(S>1)continue;let E=T+b*S*S,w=.02*(1-S)+.002;Math.abs(m-E)<w&&(f={i:v,t:S,yn:(m-E)/w})}if(!f)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let _=.82+.3*s(f.i,4,u);return{h:.5+.3*(1-Math.abs(f.yn)),L:_*(.86+.18*f.t),T:[1-.05*f.t,1,.9],r:.6,a:1}},metal(m,y,u){let f=a(m,y,1,96,u),_=a(m,y,2,256,u+9),v=a(m,y,5,5,u+3);return{h:.6*f+.25*_+.15*v,L:.955+.045*f,r:.6*f+.2*_+.2*v}},fabric(m,y,u,f){let _=f==="wool"?48:f==="velvet"?80:64,v=Math.abs(Math.sin(Math.PI*m*_)),T=Math.abs(Math.sin(Math.PI*y*_)),b=.5+.5*Math.sin(Math.PI*m*_)*Math.sin(Math.PI*y*_),x=a(m,y,6,6,u),S=a(m,y,2,24,u+5),E=.55*Math.max(v,T)+.25*b+.2*x,w=f==="velvet"?.7*x+.3*E:E+.12*(S-.5),R=.95+.04*Math.max(v,T)-.05*(x-.5)-(f==="linen"?.05*Math.max(0,S-.6):0),C=[1,1-.02*b,1-.04*b];return{h:w,L:R,T:C,r:.5+.5*x}},paint(m,y,u){let f=a(m,y,12,12,u),_=a(m,y,3,3,u+11);return{h:.8*f+.2*_,L:.98+.02*f,r:.9*f+.1*_}},ceramic(m,y,u){let f=a(m,y,4,4,u);return{h:f,L:.985+.015*f,r:f}},leather(m,y,u){let f=a(m,y,18,18,u),_=a(m,y,3,3,u+17);return{h:.75*f+.25*_,L:.94+.06*f-.04*(_-.5),r:.5+.5*f}},rubber(m,y,u){let f=a(m,y,10,10,u);return{h:f,L:.96+.04*f,r:.5+.5*f}},fur(m,y,u,f){let _=f==="long",v=f==="plush",T=_?2:v?6:4,b=_?20:v?24:32,x=m+.06*(a(m,y,3,3,u+31)-.5),S=y+.025*(a(m,y,4,4,u+37)-.5),E=(Math.floor(S*b)%b+b)%b,w=x*T+s(E,7,u)*1.7,R=(Math.floor(w)%T+T)%T,C=w-Math.floor(w),L=S*b-Math.floor(S*b),P=s(R,E,u+3),H=s(E,R,u+5),O=.55+.45*P,V=C<O?Math.pow(Math.sin(Math.PI*C/O),.6):0,F=Math.pow(Math.sin(Math.PI*L),.8),D=V*F*(.55+.45*H),z=a(m,y,_?2:4,_?96:192,u),W=a(m,y,2,2,u+21),j=(v?.4:.6)*D+.4*z,K=.94+.07*D+.04*(z-.5)-.07*(W-.5),st=[1,1-.03*(1-D),1-.06*(1-D)];return{h:j,L:K,T:st,r:.5*(1-D)+.5*z}},stone(m,y,u,f){let _=a(m,y,3,3,u),v=a(m,y,9,9,u+7),T=Math.pow(a(m,y,28,28,u+15),3),b=f==="concrete"?a(m,y,40,40,u+23):v;return{h:.45*_+.35*b-.35*T,L:.9+.12*(_-.5)+.06*(b-.5)-.1*T,T:[1,1-.02*_,1-.05*_],r:.5*b+.5*_}},snow(m,y,u){let f=a(m,y,3,3,u),_=a(m,y,40,40,u+5);return{h:.7*f+.3*_,L:.96+.04*_,T:[.985,.995,1],r:_}},foliage(m,y,u){let f=Math.pow(Math.abs(Math.sin(Math.PI*y*10+(a(m,y,3,3,u)-.5)*2)),8),_=a(m,y,24,24,u+9);return{h:.6*f+.4*_,L:.93+.07*_-.06*f,T:[1-.04*_,1,1-.06*_],r:.6*_+.4*(1-f)}},soil(m,y,u){let f=a(m,y,8,8,u),_=a(m,y,48,48,u+11),v=Math.pow(a(m,y,16,16,u+19),5);return{h:.5*f+.3*_+.4*v,L:.88+.14*(f-.5)+.08*(_-.5)+.1*v,r:_}},glass(m,y,u){let f=a(m,y,3,3,u);return{h:f,L:.99+.01*f,r:f}},plastic(m,y,u){let f=a(m,y,30,30,u);return{h:f,L:.985+.015*f,r:f}},emissive(m,y,u){let f=a(m,y,4,4,u);return{h:f,L:.97+.03*f,r:f}},skin(m,y,u){let f=a(m,y,48,48,u),_=a(m,y,3,3,u+3);return{h:f,L:.97+.03*(f-.5)-.03*(_-.5),T:[1,1-.015*_,1-.02*_],r:f}},paper(m,y,u){let f=a(m,y,6,60,u),_=a(m,y,5,5,u+7);return{h:.7*f+.3*_,L:.96+.04*(f-.5)-.03*(_-.5),r:f}},keratin(m,y,u){let f=.5+.5*Math.sin(2*Math.PI*(m*6+(a(m,y,2,2,u)-.5)*.8)),_=a(m,y,2,48,u+5);return{h:.5*f+.5*_,L:.95+.05*_-.04*Math.pow(f,3),r:.5*f+.5*_}}},g=globalThis[Symbol.for("polyfork.materials.maps")]??=new Map;g.has("186")||g.set("186",new Map);let M=g.get("186"),I=(m,y)=>{let u=y>>>0;for(let f=0;f<m.length;f++)u=Math.imul(u^m[f],16777619);return(u>>>0).toString(16).padStart(8,"0")},k=m=>I(m,2166136261)+I(m,2538058380);function G(m,y,u,f){let _=k(m),v=`tex:${u?"s":"l"}:${y}:${_}`;if(M.has(v))return M.get(v);let T=new kn(m,y,y,Zi);return T.wrapS=T.wrapT=Un,T.minFilter=Yi,T.magFilter=qi,T.generateMipmaps=!0,T.anisotropy=8,u&&(T.colorSpace=jt),T.name=f,T.userData.pfHash=_,T.needsUpdate=!0,M.set(v,T),T}let B=(m,y=null)=>(p[m]||p.paint).length>=4||!!(y&&t[m]&&t[m].finishes[y]&&t[m].finishes[y].pattern);function U(m,y,u){let f=t[m]||t.paint,_=B(m,y),v=`pattern:${m}:${_?y:"*"}:${u}`;if(M.has(v))return M.get(v);let T=f.finishes[y]||{},b=_&&T.size||f.size,x=b*b,S=_&&p[`${m}:${y}`]||p[m]||p.paint,E=new Float32Array(x),w=new Float32Array(x),R=new Uint8Array(x*4),C=new Uint8Array(x*4),L=V=>Math.max(0,Math.min(1,V));for(let V=0;V<b;V++)for(let F=0;F<b;F++){let D=V*b+F,z=S(F/b,V/b,u,y);E[D]=z.h,w[D]=L(z.r);let W=L(z.L),j=z.T||[1,1,1];R[D*4]=Math.round(L(W*j[0])*255),R[D*4+1]=Math.round(L(W*j[1])*255),R[D*4+2]=Math.round(L(W*j[2])*255),R[D*4+3]=Math.round(L(z.a??1)*255)}if(R.some((V,F)=>(F&3)===3&&V<128)){let V=new Uint8Array(x);for(let F=0;F<x;F++)V[F]=R[F*4+3]>=128?1:0;for(let F=0;F<6;F++){let D=[];for(let z=0;z<b;z++)for(let W=0;W<b;W++){let j=z*b+W;if(V[j])continue;let K=0,st=0,at=0,gt=0,mt=0;for(let[_t,et]of[[1,0],[-1,0],[0,1],[0,-1]]){let Z=(z+et+b)%b*b+(W+_t+b)%b;V[Z]&&(K+=E[Z],st+=R[Z*4],at+=R[Z*4+1],gt+=R[Z*4+2],mt++)}mt&&D.push([j,K/mt,st/mt,at/mt,gt/mt])}if(!D.length)break;for(let[z,W,j,K,st]of D)E[z]=W,R[z*4]=j,R[z*4+1]=K,R[z*4+2]=st,V[z]=1}}let P=(_&&T.normal||f.normal)*b*.02;for(let V=0;V<b;V++)for(let F=0;F<b;F++){let D=V*b+F,z=(E[V*b+(F+1)%b]-E[V*b+(F-1+b)%b])*P,W=(E[(V+1)%b*b+F]-E[(V-1+b)%b*b+F])*P,j=Math.hypot(z,W,1);C[D*4]=Math.round((-z/j*.5+.5)*255),C[D*4+1]=Math.round((-W/j*.5+.5)*255),C[D*4+2]=Math.round((1/j*.5+.5)*255),C[D*4+3]=255}let H=_?`${m}-${y}`:m,O={S:b,R:w,map:G(R,b,!0,`${H}-albedo`),normalMap:G(C,b,!1,`${H}-normal`)};return M.set(v,O),O}function N(m,y=null,u=1){let f=t[m]||t.paint,_=y&&f.finishes[y]?y:Object.keys(f.finishes)[0],v=`${m}:${_}:${u}`;if(M.has(v))return M.get(v);let T=U(m,_,u),[b,x]=f.finishes[_].roughness||f.roughness,S=T.S*T.S,E=new Uint8Array(S*4);for(let R=0;R<S;R++)E[R*4+1]=Math.round((b+(x-b)*T.R[R])*255),E[R*4+2]=255,E[R*4+3]=255;let w={map:T.map,roughnessMap:G(E,T.S,!1,`${m}-${_}-orm`),normalMap:T.normalMap,tile:f.tile};return M.set(v,w),w}function X(m,y,u=""){let f=m&&typeof m=="object"?m:{kind:"paint"},_=t[f.kind]?f.kind:"paint",v=t[_],T=f.finish&&v.finishes[f.finish]?f.finish:Object.keys(v.finishes)[0],b=v.finishes[T],x=N(_,T,f.seed??1),S=new ut(y??"#cccccc"),E=new qn({color:S,map:x.map,roughnessMap:x.roughnessMap,metalnessMap:x.roughnessMap,roughness:1,metalness:f.metalness??b.metalness??v.metalness,normalMap:x.normalMap,normalScale:new bt(1,-1).multiplyScalar(f.normal??b.relief??v.relief??1),envMapIntensity:1,vertexColors:!0});return b.sheen&&(E.sheen=b.sheen,E.sheenRoughness=b.sheenRoughness??.7,E.sheenColor=S.clone().lerp(new ut("#ffffff"),(b.sheenWhite??.55)*(f.whiten??1)),E.userData.sheenWhite=(b.sheenWhite??.5)*(f.whiten??1)),b.clearcoat&&(E.clearcoat=b.clearcoat,E.clearcoatRoughness=b.clearcoatRoughness??.1),b.anisotropy&&(E.anisotropy=b.anisotropy,E.anisotropyRotation=0),b.transmission&&(E.transmission=f.transmission??b.transmission,E.thickness=f.thickness??b.thickness??.01,E.ior=b.ior??1.5,E.attenuationColor=S.clone(),E.attenuationDistance=f.attenuationDistance??.03),b.emissive&&(E.emissive=S.clone(),E.emissiveIntensity=f.intensity??b.emissive,E.userData.emits=!0),b.fire&&$(E,f.intensity??b.emissive),b.cutout&&(E.alphaTest=.5,E.alphaToCoverage=!1,E.side=Ae,E.shadowSide=Ae,E.transparent=!1,E.userData.cutout=!0),b.specular!==void 0&&(E.specularIntensity=b.specular),b.glance!==void 0&&it(E,b.glance),b.twoSided&&(E.side=Ae,E.shadowSide=Ae),E.name=u,E}let Y=globalThis[Symbol.for("polyfork.fires")]||={set:new Set,loop:!1};function $(m,y=2.6){let u={uTime:{value:1.7},uBase:{value:0},uHeight:{value:1},uFire:{value:y}};m.userData.fire=u,m.transparent=!1,m.alphaTest=.5,m.alphaToCoverage=!0,m.side=Ae,m.shadowSide=Ae;let f=m.onBeforeCompile,_=m.customProgramCacheKey;return m.customProgramCacheKey=()=>`${_?_.call(m):""}|pf-fire`,m.onBeforeCompile=(v,T)=>{f&&f.call(m,v,T),Object.assign(v.uniforms,u),v.vertexShader=v.vertexShader.replace("#include <common>",`#include <common>
uniform float uTime; uniform float uBase; uniform float uHeight; varying vec3 vPfPos; varying float vPfH; varying float vPfEdge;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	float pfH = clamp((position.y - uBase) / max(uHeight, 1e-3), 0.0, 1.0);
	float pfS = pfH * pfH * uHeight * 0.10;
	transformed.x += sin(uTime * 6.3 + position.y * 7.0 + position.z * 3.0) * pfS;
	transformed.z += cos(uTime * 5.1 + position.y * 6.0 + position.x * 3.0) * pfS;
	transformed.y += sin(uTime * 8.0 + position.x * 5.0) * pfS * 0.5;
	vPfPos = transformed; vPfH = pfH;
	vPfEdge = abs(dot(normalize(normalMatrix * normal), normalize(-(modelViewMatrix * vec4(transformed, 1.0)).xyz)));   // 1 facing the eye, 0 at the silhouette`),v.fragmentShader=v.fragmentShader.replace("#include <common>",`#include <common>
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
	totalEmissiveRadiance = pfRamp * uFire * (0.35 + 0.85 * pfHeat);   // red edges glow, the core burns`)},Y.set.add(m),q(),m}function q(){if(Y.loop||typeof requestAnimationFrame!="function")return;Y.loop=!0;let m=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches,y=u=>{m||Q(u/1e3),requestAnimationFrame(y)};requestAnimationFrame(y)}function Q(m){for(let y of Y.set){let u=y.userData.fire;u&&(u.uTime.value=m)}}function tt(m){let y=[];if(m.updateMatrixWorld(!0),m.traverse(x=>{if(!x.isMesh||!x.geometry)return;let S=[].concat(x.material||[]).map(w=>w&&w.userData.fire).filter(Boolean);if(!S.length)return;x.geometry.boundingBox||x.geometry.computeBoundingBox();let E=x.geometry.boundingBox.clone().applyMatrix4(x.matrixWorld);x.castShadow=!1,x.receiveShadow=!1,y.push({o:x,us:S,wb:E})}),!y.length)return 0;let u=y.map((x,S)=>S),f=x=>{for(;u[x]!==x;)u[x]=u[u[x]],x=u[x];return x};for(let x=0;x<y.length;x++)for(let S=x+1;S<y.length;S++){let E=y[x].wb.clone().expandByScalar(.1*y[x].wb.getSize(new A).length()),w=y[S].wb;if(E.intersectsBox(w)){let R=f(x),C=f(S);R!==C&&(u[R]=C)}}let _=new Map;y.forEach((x,S)=>{let E=f(S);_.has(E)?_.get(E).union(x.wb):_.set(E,x.wb.clone())});let v=new Ht,T=new A,b=new A;return y.forEach((x,S)=>{let E=_.get(f(S)),w=E.getCenter(new A);v.copy(x.o.matrixWorld).invert(),T.set(w.x,E.min.y,w.z).applyMatrix4(v),b.set(w.x,E.max.y,w.z).applyMatrix4(v);for(let R of x.us)R.uBase.value=Math.min(T.y,b.y),R.uHeight.value=Math.max(.02,Math.abs(b.y-T.y))}),y.length}function it(m,y){let u=m.onBeforeCompile,f=m.customProgramCacheKey,_=Number(y).toFixed(3);m.customProgramCacheKey=()=>`${f?f.call(m):""}|pf-glance-${_}`,m.onBeforeCompile=(v,T)=>{u&&u.call(m,v,T),v.fragmentShader=v.fragmentShader.replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
	reflectedLight.directSpecular *= ${_};
	reflectedLight.indirectSpecular *= ${_};`)},m.userData.glance=y}function dt(m,y=.5,u=null,f=0){let v=m.attributes.position.count,T=new Float32Array(v*2);return lt(m,T,0,v,y,u,f)}function lt(m,y,u,f,_=.5,v=null,T=0,b=null){let x=m.attributes.position,S=u+f,E=new A,w=new A,R=new A,C=new A,L=1/_;if(Array.isArray(v)&&v.length===3){let P=new A(v[0],v[1],v[2]).normalize(),H=new A;for(let O=u;O<S;O+=3){E.fromBufferAttribute(x,O),w.fromBufferAttribute(x,O+1),R.fromBufferAttribute(x,O+2),C.subVectors(w,E).cross(R.clone().sub(E)).normalize(),H.crossVectors(C,P),H.lengthSq()<1e-8&&H.set(1,0,0).cross(P),H.normalize();for(let V=0;V<3;V++){let F=V===0?E:V===1?w:R;y[(O+V)*2]=F.dot(P)*L+T,y[(O+V)*2+1]=F.dot(H)*L+T*.37}}return m.setAttribute("uv",new Ot(y,2)),m}for(let P=u;P<S;P+=3){E.fromBufferAttribute(x,P),w.fromBufferAttribute(x,P+1),R.fromBufferAttribute(x,P+2),C.subVectors(w,E).cross(R.clone().sub(E));let H=Math.abs(C.x),O=Math.abs(C.y),V=Math.abs(C.z),F;H>=O&&H>=V?F=v==="z"?["z","y"]:["y","z"]:O>=V?F=v==="z"?["z","x"]:["x","z"]:F=v==="x"?["x","y"]:["y","x"];for(let D=0;D<3;D++){let z=D===0?E:D===1?w:R;y[(P+D)*2]=z[F[0]]*L+T,y[(P+D)*2+1]=z[F[1]]*L+T*.37}}return m.setAttribute("uv",new Ot(y,2)),m}function yt(m,y=30){let u=m.attributes.position,f=u.count,_=f/3,v=new Float32Array(_*3),T=new Float32Array(_),b=new A,x=new A,S=new A,E=new A;for(let P=0;P<_;P++){b.fromBufferAttribute(u,P*3),x.fromBufferAttribute(u,P*3+1),S.fromBufferAttribute(u,P*3+2),E.subVectors(x,b).cross(S.clone().sub(b));let H=E.length();T[P]=H,H>1e-14&&E.divideScalar(H),v[P*3]=E.x,v[P*3+1]=E.y,v[P*3+2]=E.z}let w=1e4,R=new Map;for(let P=0;P<f;P++){let H=`${Math.round(u.getX(P)*w)},${Math.round(u.getY(P)*w)},${Math.round(u.getZ(P)*w)}`,O=R.get(H);O||(O=[],R.set(H,O)),O.push(P)}let C=Math.cos(y*Math.PI/180),L=new Float32Array(f*3);for(let P of R.values())for(let H of P){let O=H/3|0,V=v[O*3],F=v[O*3+1],D=v[O*3+2],z=0,W=0,j=0;for(let st of P){let at=st/3|0,gt=v[at*3],mt=v[at*3+1],_t=v[at*3+2];V*gt+F*mt+D*_t<C||(z+=gt*T[at],W+=mt*T[at],j+=_t*T[at])}let K=Math.hypot(z,W,j);K<1e-12?(z=V,W=F,j=D):(z/=K,W/=K,j/=K),L[H*3]=z,L[H*3+1]=W,L[H*3+2]=j}return m.setAttribute("normal",new Ot(L,3)),m}function ot(m,{amp:y=.004,scale:u=.12,seed:f=1}={}){yt(m,180);let _=m.attributes.position,v=m.attributes.normal,T=_.count,b=1/u;for(let x=0;x<T;x++){let S=_.getX(x),E=_.getY(x),w=_.getZ(x),R=(d(S*b,E*b,w*b,f)-.5)*2*y;_.setXYZ(x,S+v.getX(x)*R,E+v.getY(x)*R,w+v.getZ(x)*R)}return m.deleteAttribute("normal"),m}function It(m,y=[]){let u=m.index?m.toNonIndexed():m;u===m&&(u=m.clone());for(let f of Object.keys(u.attributes))f!=="position"&&!y.includes(f)&&u.deleteAttribute(f);return u}function wt(m){let y=t[m.kind]||t.paint,u=y.finishes[m.finish]||{};return m.tile??u.tile??y.tile}function Dt(m,{name:y="part",colors:u={},materials:f={},crease:_=30}={}){let v=new Map;for(let b of m){if(!b||!b.g)continue;let x=b.zone??"body",S=f[x]||{kind:"paint"};v.has(x)||v.set(x,[]);let E=b.uv==="own"&&b.g.getAttribute("uv")?It(b.g,["uv"]):dt(It(b.g),wt(S),b.grain??S.grain??null,b.shift??0),w=Math.max(.2,Math.min(1.25,b.tone??1)),R=E.attributes.position.count,C=new Float32Array(R*3).fill(w);E.setAttribute("color",new Ot(C,3)),v.get(x).push(E)}let T=new _n;T.name=y;for(let[b,x]of v){let S=f[b]||{kind:"paint"},E=x.length===1?x[0]:ra(x),w=t[S.kind]&&t[S.kind].finishes[S.finish]?t[S.kind].finishes[S.finish].crease:void 0;yt(E,w!==void 0?Math.max(S.crease??0,w):S.crease??_);let R=new zn(E,X(S,u[b],b));R.name=`${y}-${b}`,R.castShadow=R.receiveShadow=!0,T.add(R)}return tt(T),T}function St(m,y,u=null){return!(y?.transmission>0)||!("transmission"in m)||(m.transmission=y.transmission,m.thickness=y.thickness??0,m.ior=y.ior??1.5,y.attenuationColor&&m.attenuationColor.copy(y.attenuationColor),m.attenuationDistance=y.attenuationDistance??1/0,m.normalMap=null,m.roughnessMap=null,m.metalnessMap=null,m.roughness=Math.min(m.roughness,.08),m.metalness=0,m.side=Ae,m.needsUpdate=!0,u&&(u.castShadow=!1,u.renderOrder=Math.max(u.renderOrder,1))),m}function Et(m,y={},{force:u=!1,cache:f=null}={}){let _=0;return m.traverse(v=>{if(!v.isMesh||!v.material)return;let b=(Array.isArray(v.material)?v.material:[v.material]).map(x=>{if(!x||!x.name||!y[x.name]||!u&&x.map)return x;let S=x.userData&&x.userData.authoredColor,w="#"+(S?new ut().fromArray(S.baseColorFactor):x.color).getHexString(),R=!!v.geometry.attributes.color,C=S&&R?S.vertexScale:null,L=x.transmission>0?"|t"+x.transmission:"",P=x.name+"|"+w+"|"+R+L+(C?"|"+C.join(","):""),H=f&&f.get(P);return H||(H=St(X(y[x.name],w,x.name),x),H.vertexColors=R,C&&(H.color.multiply(new ut().fromArray(C)),H.userData.vertexScale=C),f&&(f.set(P,H),H.dispose=()=>{})),L&&St(H,x,v),_++,H});v.material=Array.isArray(v.material)?b:b[0]}),_&&tt(m),_}let Ct=[[/\b(flame|fire|ember|glow|bulb|neon|lit|lamp ?light|led)\b/,{kind:"emissive",finish:"glow"}],[/\b(screen|display|monitor face)\b/,{kind:"glass",finish:"clear"}],[/\b(window|pane|glass|bottle|lens|visor|windscreen)\b/,{kind:"glass",finish:"clear"}],[/\b(snow|frost|ice)\b/,{kind:"snow",finish:"powder"}],[/\b(leaf|leaves|petal|grass|moss|stem|vine|foliage|frond|needles?|blossom|bloom|flower)\b/,{kind:"foliage",finish:"leaf"}],[/\b(soil|dirt|sand|gravel|mud|earth|ground|ash)\b/,{kind:"soil",finish:"dry"}],[/\b(stone|rock|concrete|brick|slate|marble|granite|cobble|plinth|masonry|mortar|cement)\b/,{kind:"stone",finish:"rough"}],[/\b(skin|face|hand|arm|leg flesh|brow|cheek|neck)\b/,{kind:"skin",finish:"natural"}],[/\b(denim|jeans)\b/,{kind:"fabric",finish:"denim"}],[/\b(shirt|blouse|dress|skirt|trousers|pants|briefs|bra|sock|cuff|collar|waistband|sleeve|apron|robe|tunic|cloak|scarf|hat band)\b/,{kind:"fabric",finish:"cotton"}],[/\b(jumper|sweater|knit|beanie)\b/,{kind:"fabric",finish:"knit"}],[/\b(sole|tread|tyre|tire)\b/,{kind:"rubber",finish:"black"}],[/\b(paper|book|page|card|cardboard|label|poster|parchment)\b/,{kind:"paper",finish:"plain"}],[/\b(plastic|vinyl|resin|acrylic|bakelite)\b/,{kind:"plastic",finish:"satin"}],[/\b(eye|pupil|iris|lens|glass|glaze|porcelain|ceramic|enamel)\b/,{kind:"ceramic",finish:"glazed"}],[/\b(hoof|hooves|claw|talon|horn|antler|beak|bill|nail|tusk|tooth|teeth|shell|carapace)\b/,{kind:"keratin",finish:"natural"}],[/\b(mane|tail|hair|feather|beard|whisker|brush)\b/,{kind:"fur",finish:"long"}],[/\b(nose|snout|muzzle pad|tongue|lid|lip|pad|skin|inner ear|inner)\b/,{kind:"leather",finish:"grain"}],[/\b(fur|coat|hide|pelt|fleece|wool(?!len)|points|blaze|belly|bib|cream|markings?|flank|sock|cape|ruff|mask)\b/,{kind:"fur",finish:"short"}],[/\b(brass|bronze|copper|gold|steel|iron|chrome|alumin|metal|tin|zinc|rod|rail|bolt|rivet|chain|wire)\b/,{kind:"metal",finish:"brushed"}],[/\b(oak|walnut|ash|pine|timber|wood|plank|board|beam|bamboo|plywood)\b/,{kind:"wood",finish:"oiled"}],[/\b(leather|saddle|strap|harness|belt|boot)\b/,{kind:"leather",finish:"grain"}],[/\b(linen|wool|cotton|canvas|fabric|cloth|cushion|upholster|sail|rug|blanket|curtain|towel|rope|cord)\b/,{kind:"fabric",finish:"linen"}],[/\b(rubber|tyre|tire|gasket)\b/,{kind:"rubber",finish:"black"}],[/\b(tile|sink|basin|bath|toilet|crockery|mug|plate)\b/,{kind:"ceramic",finish:"glazed"}]];function Xt(m={}){let y={};for(let[u,f]of Object.entries(m)){if(!f||f.type!=="color")continue;let _=`${u} ${f.label||""} ${f.describe||""}`.toLowerCase().replace(/_/g," "),v=`${u} ${f.label||""}`.toLowerCase(),T=null;for(let[b,x]of Ct)if(b.test(v)){T=x;break}if(!T){for(let[b,x]of Ct)if(b.test(_)){T=x;break}}y[u]={...T||{kind:"paint",finish:"matte"},guessed:!0}}return y}let qt={fur:1,skin:.6,foliage:.8,soil:1,snow:1},le={ofSize:.022,min:.003,max:.045};function Yt(m,y,u,f){let _=m.attributes.position,v=_.count,T=v/3;if(u.filter(C=>C>0).length<2)return null;let b=new Uint32Array(v),x=new Map;for(let C=0;C<v;C++){let L=`${Math.round(_.getX(C)*1e4)},${Math.round(_.getY(C)*1e4)},${Math.round(_.getZ(C)*1e4)}`,P=x.get(L);P===void 0&&(P=x.size,x.set(L,P)),b[C]=P}let S=new Map;for(let C=0;C<T;C++){let L=y[C];if(u[L]>0)for(let P=0;P<3;P++){let H=C*3+P,O=C*3+(P+1)%3,V=b[H],F=b[O],D=V<F?V*4294967296+F:F*4294967296+V,z=S.get(D);z||(z={i0:H,i1:O,zones:[],room:1/0},S.set(D,z)),z.zones.includes(L)||z.zones.push(L);let W=C*3+(P+2)%3,j=_.getX(O)-_.getX(H),K=_.getY(O)-_.getY(H),st=_.getZ(O)-_.getZ(H),at=_.getX(W)-_.getX(H),gt=_.getY(W)-_.getY(H),mt=_.getZ(W)-_.getZ(H),_t=K*mt-st*gt,et=st*at-j*mt,Z=j*gt-K*at,nt=Math.sqrt(_t*_t+et*et+Z*Z)/(Math.sqrt(j*j+K*K+st*st)||1e-9);nt<z.room&&(z.room=nt)}}let E=new Map;for(let C of S.values()){if(C.zones.length<2)continue;let L={ax:_.getX(C.i0),ay:_.getY(C.i0),az:_.getZ(C.i0),bx:_.getX(C.i1),by:_.getY(C.i1),bz:_.getZ(C.i1)};for(let P of C.zones){let H=C.zones.find(V=>V!==P);E.has(P)||E.set(P,[]);let O=Math.max(1e-4,Math.min(f,C.room*.5));E.get(P).push({...L,other:H,gain:Math.min(u[P],u[H]),scale:f/O})}}if(!E.size)return null;let w=new Float32Array(v*3),R=new Map;for(let C=0;C<v;C++){let L=y[C/3|0],P=E.get(L);if(!P){w[C*3]=1e3,w[C*3+1]=L;continue}let H=b[C]*64+L,O=R.get(H);if(!O){let V=_.getX(C),F=_.getY(C),D=_.getZ(C),z=1/0,W=L,j=0;for(let K of P){let st=K.bx-K.ax,at=K.by-K.ay,gt=K.bz-K.az,mt=st*st+at*at+gt*gt||1e-12,_t=((V-K.ax)*st+(F-K.ay)*at+(D-K.az)*gt)/mt;_t=_t<0?0:_t>1?1:_t;let et=V-(K.ax+st*_t),Z=F-(K.ay+at*_t),nt=D-(K.az+gt*_t),ct=(et*et+Z*Z+nt*nt)*K.scale*K.scale;ct<z&&(z=ct,W=K.other,j=K.gain)}O=[Math.sqrt(z),W,j],R.set(H,O)}w[C*3]=O[0],w[C*3+1]=O[1],w[C*3+2]=O[2]}return w}function ce(m,y){m.defines={...m.defines||{},PF_BLEND_ZONES:y.count},m.customProgramCacheKey=()=>`pf-blend-${y.count}`,m.onBeforeCompile=u=>{u.uniforms.uPfZone=y.zone,u.uniforms.uPfBand=y.band,u.vertexShader=u.vertexShader.replace("#include <common>",`#include <common>
attribute vec3 aPfBlend;
uniform vec3 uPfZone[PF_BLEND_ZONES];
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_vertex>",`#include <color_vertex>
vPfOther = uPfZone[int(aPfBlend.y + 0.5)];
vPfBlend = aPfBlend.xz;`),u.fragmentShader=u.fragmentShader.replace("#include <common>",`#include <common>
uniform float uPfBand;
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_fragment>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
  { float pfT = 0.5 * vPfBlend.y * ( 1.0 - smoothstep( 0.0, uPfBand, vPfBlend.x ) );
    diffuseColor.rgb *= mix( vColor.rgb, vPfOther, pfT );
    #ifdef USE_COLOR_ALPHA
      diffuseColor.a *= vColor.a;
    #endif
  }
#endif`)},m.onBeforeRender=(u,f,_,v)=>{let T=u.info.render.frame;if(y.frame===T&&y.geo===v)return;y.frame=T,y.geo=v;let b=v.attributes.color;if(b)for(let x=0;x<y.count;x++){let S=y.rep[x];S>=0&&y.zone.value[x].set(b.getX(S),b.getY(S),b.getZ(S))}},m.needsUpdate=!0}function vt(m,y={},u={},{force:f=!1,smooth:_="auto",blend:v="auto"}={}){let T=Object.keys(y).filter(S=>u[S]);if(!T.length)return 0;let b=T.map(S=>new ut(y[S])),x=0;return m.traverse(S=>{if(!S.isMesh||!S.geometry||Array.isArray(S.material))return;let E=S.material;if(!E||!E.vertexColors||!f&&E.map)return;let w=S.geometry;w.index&&(w=w.toNonIndexed(),S.geometry.dispose(),S.geometry=w);let R=w.attributes.color,C=w.attributes.position;if(!R||!C)return;let L=C.count/3;w.computeBoundingBox();let P=w.boundingBox,H=P.max.z-P.min.z>P.max.x-P.min.x?"z":"x",O=Math.max(P.max.x-P.min.x,P.max.y-P.min.y,P.max.z-P.min.z)||1,V=et=>Math.max(et.bodyClamp[0],Math.min(et.bodyClamp[1],O/et.body)),F=new Uint8Array(L),D=new Array(T.length).fill(0);for(let et=0;et<L;et++){let Z=0,nt=0,pt=0;for(let Pt=0;Pt<3;Pt++)Z+=R.getX(et*3+Pt),nt+=R.getY(et*3+Pt),pt+=R.getZ(et*3+Pt);Z/=3,nt/=3,pt/=3;let ct=0,Ft=1/0;for(let Pt=0;Pt<b.length;Pt++){let ge=b[Pt],je=(ge.r-Z)**2+(ge.g-nt)**2+(ge.b-pt)**2;je<Ft&&(Ft=je,ct=Pt)}F[et]=ct,D[ct]++}let z=new Uint32Array(L*3),W=[],j=0;for(let et=0;et<T.length;et++)W.push(j),j+=D[et]*3;let K=W.slice(),st=new Float32Array(C.count*2);for(let et=0;et<L;et++){let Z=F[et],nt=W[Z];z[nt]=et*3,z[nt+1]=et*3+1,z[nt+2]=et*3+2,W[Z]+=3;let pt=u[T[Z]],ct=t[pt.kind]||t.paint;lt(w,st,et*3,3,pt.tile??((ct.finishes[pt.finish]||{}).tile??ct.tile)*(ct.body?V(ct):1),pt.grain??H)}w.setAttribute("uv",new Ot(st,2));let at=_==="auto"?S.isSkinnedMesh?55:35:_;at&&yt(w,at);let gt=v==="auto"||v===!0?1:Math.max(0,Math.min(4,Number(v)||0)),mt=null;if(gt>0){let et=T.map(ct=>Math.max(0,Math.min(1,Number(u[ct].blend??qt[u[ct].kind]??0)))),Z=new A;P.getSize(Z);let nt=Math.max(le.min,Math.min(le.max,Z.length()*le.ofSize))*gt,pt=Yt(w,F,et,nt);if(pt){w.setAttribute("aPfBlend",new Ot(pt,3));let ct=T.map(()=>-1);for(let Ft=0;Ft<L;Ft++)ct[F[Ft]]<0&&(ct[F[Ft]]=Ft*3);mt={count:T.length,rep:ct,band:{value:nt},zone:{value:T.map(Ft=>new A().setFromColor(new ut(y[Ft])))},frame:-1,geo:null},w.userData.blendBand=nt}}w.setIndex(new Ot(z,1)),w.clearGroups();let _t=[];for(let et=0;et<T.length;et++){if(!D[et])continue;w.addGroup(K[et],D[et]*3,_t.length);let Z=X(u[T[et]],"#ffffff",T[et]);Z.vertexColors=!0,Z.flatShading=at?!1:!!E.flatShading,Z.sheen&&(Z.sheenColor=new ut(y[T[et]]).lerp(new ut("#ffffff"),Z.userData.sheenWhite??.5)),Z.userData.emits&&(Z.emissive=new ut(y[T[et]])),E.side!==void 0&&(Z.side=E.side),mt&&ce(Z,mt),_t.push(Z)}S.material=_t,x++}),x}function re(m,y,u=18,f=!1){let _=f?[...m,m[0]]:m,v=_.length,T=[];for(let w=0;w<v;w++){let R=f?_[(w-1+v-1)%(v-1)]:_[Math.max(0,w-1)],C=f?_[(w+1)%(v-1)]:_[Math.min(v-1,w+1)];T.push(new A().subVectors(C,R).normalize())}let b=new A(1,0,0);Math.abs(b.dot(T[0]))>.9&&b.set(0,1,0);let x=[];for(let w=0;w<v;w++){let R=T[w];b=b.clone().addScaledVector(R,-b.dot(R)).normalize();let C=new A().crossVectors(R,b).normalize(),L=[];for(let P=0;P<u;P++){let H=(P+.5)/u*Math.PI*2,O=_[w].clone().addScaledVector(b,Math.cos(H)*y).addScaledVector(C,Math.sin(H)*y);L.push([O.x,O.y,O.z])}x.push(L)}f&&(x[v-1]=x[0]);let S=[],E=(w,R,C)=>S.push(w[0],w[1],w[2],R[0],R[1],R[2],C[0],C[1],C[2]);for(let w=0;w<v-1;w++){let R=x[w],C=x[w+1];for(let L=0;L<u;L++){let P=(L+1)%u;E(R[L],R[P],C[P]),E(R[L],C[P],C[L])}}return S}function he(m,y,u=10){return re(m.map(f=>new A(f[0],f[1],f[2])),y,u,!0)}function Zt(m,y=24,u=0,f=0){let _=m.map(([x,S])=>{let E=[];for(let w=0;w<y;w++){let R=(w+.5)/y*Math.PI*2;E.push([u+Math.cos(R)*x,S,f+Math.sin(R)*x])}return E}),v=[],T=(x,S,E)=>v.push(x[0],x[1],x[2],S[0],S[1],S[2],E[0],E[1],E[2]);for(let x=0;x<_.length-1;x++){let S=_[x],E=_[x+1];for(let w=0;w<y;w++){let R=(w+1)%y;T(S[w],S[R],E[R]),T(S[w],E[R],E[w])}}let b=(x,S,E)=>{let w=[u,S,f];for(let R=0;R<y;R++){let C=(R+1)%y;E?T(w,x[C],x[R]):T(w,x[R],x[C])}};return m[0][0]>0&&b(_[0],m[0][1],!1),m[m.length-1][0]>0&&b(_[_.length-1],m[m.length-1][1],!0),v}function $e(m,y,u,f,_,v,T=.002){let b=new Vn(m,y,u,1,1,1).translate(f,_,v),x=m/2,S=u/2,E=[[x,S-T],[x-T,S],[-x+T,S],[-x,S-T],[-x,-S+T],[-x+T,-S],[x-T,-S],[x,-S+T]],w=[],R=(O,V,F)=>w.push(O[0],O[1],O[2],V[0],V[1],V[2],F[0],F[1],F[2]),C=_-y/2,L=_+y/2,P=E.length;for(let O=0;O<P;O++){let V=(O+1)%P,F=[f+E[O][0],C,v+E[O][1]],D=[f+E[V][0],C,v+E[V][1]],z=[f+E[V][0],L,v+E[V][1]],W=[f+E[O][0],L,v+E[O][1]];R(F,D,z),R(F,z,W),R([f,L,v],W,z),R([f,C,v],D,F)}b.dispose();let H=new pe;return H.setAttribute("position",new Gt(w,3)),H}function ke(m,y,u,f){let _=[];for(let v=0;v<=f;v++){let T=y+(u-y)*v/f;_.push([m*Math.cos(T),m*Math.sin(T)])}return _}function vn(m){let y=new pe;return y.setAttribute("position",new Gt(m,3)),y}function Ve(m){let y=(Math.imul(m|0,2654435761)^2654435769)>>>0||1;return()=>(y^=y<<13,y>>>=0,y^=y>>>17,y^=y<<5,y>>>=0,y/4294967296)}let me=[.84,.92,1,1.07,1.14],Ke=(m,y)=>{let u=2*m()-1,f=2*Math.PI*m(),_=Math.sqrt(Math.max(0,1-u*u));return y.set(_*Math.cos(f),u,_*Math.sin(f))},Mn=(m,y)=>{let u=Ke(y,new A);return u.addScaledVector(m,-u.dot(m)),u.lengthSq()<1e-6&&u.set(0,1,0).addScaledVector(m,-m.y),u.normalize()};class Jn{constructor(){this.P=me.map(()=>[]),this.U=me.map(()=>[])}add(y,u,f,_,v,T,b=!1,x=0){let S=new A().crossVectors(f,u);S.lengthSq()<1e-8&&S.set(1,0,0).cross(u),S.normalize();let E=new A().crossVectors(u,S).normalize(),w=this.P[T],R=this.U[T],C=b?1:0,L=b?0:1,P=(O,V,F,D,z)=>{let W=(j,K)=>w.push(y.x+S.x*j*_+O.x*K*v,y.y+S.y*j*_+O.y*K*v,y.z+S.z*j*_+O.z*K*v);W(-1,D),W(1,D),W(1,z),W(-1,D),W(1,z),W(-1,z),R.push(C,V,L,V,L,F,C,V,L,F,C,F)};if(!(x>0)){P(E,0,1,-1,1);return}let H=x*Math.PI/360;P(E.clone().applyAxisAngle(S,H),0,.5,-1,0),P(E.clone().applyAxisAngle(S,-H),.5,1,0,1)}parts(y){let u=[];return me.forEach((f,_)=>{if(!this.P[_].length)return;let v=vn(this.P[_]);v.setAttribute("uv",new Gt(this.U[_],2)),u.push({g:v,zone:y,uv:"own",tone:f})}),u}}function $i(m,y,u,f,_=.76,v=.12){let T=new Xn(1,2),b=T.attributes.position,x=new A;for(let S=0;S<b.count;S++){x.fromBufferAttribute(b,S);let E=_*(1+v*(d(x.x*1.7+9,x.y*1.7+9,x.z*1.7+9,u,2)*2-1));b.setXYZ(S,m.x+x.x*y.x*E,m.y+x.y*y.y*E,m.z+x.z*y.z*E)}return T.deleteAttribute("normal"),T.deleteAttribute("uv"),{g:T,zone:f,tone:.3}}function $n({lobes:m=[],zone:y="leaf",core:u="leafCore",card:f=.4,density:_=1,seed:v=1,spread:T=.5,inner:b=.5,fold:x=0,facing:S="shell"}={}){let E=Ve(v*7919+1),w=new Jn,R=[],C=m.map(D=>({C:new A().fromArray(D.c),r:Array.isArray(D.r)?new A().fromArray(D.r):new A(D.r,D.r,D.r)})),L=new A,P=new A,H=new A,O=new A,V=new A,F=(D,z)=>C.some((W,j)=>j!==z&&Math.hypot((D.x-W.C.x)/W.r.x,(D.y-W.C.y)/W.r.y,(D.z-W.C.z)/W.r.z)<.82);return C.forEach(({C:D,r:z},W)=>{let K=4*Math.PI*Math.pow((Math.pow(z.x*z.y,1.6)+Math.pow(z.x*z.z,1.6)+Math.pow(z.y*z.z,1.6))/3,.625),st=Math.max(12,Math.round(_*3.8*(S==="radial"?1.7:1)*K/(f*f))),at=Math.round(st*(1+b));for(let gt=0;gt<at;gt++){let mt=gt<st;Ke(E,L);let _t=mt?.8+.14*E():.55+.25*E();if(H.set(D.x+L.x*z.x*_t,D.y+L.y*z.y*_t,D.z+L.z*z.z*_t),F(H,W))continue;let et=f*.5*(.8+.4*E()),Z=et*(.85+.3*E()),nt=Math.floor(E()*me.length);if(P.set(L.x/z.x,L.y/z.y,L.z/z.z).normalize(),S==="radial"&&mt){let pt=P.clone();Mn(pt,E).normalize();let ct=Mn(pt,E);V.crossVectors(ct,pt),H.addScaledVector(pt,-et*.25),w.add(H.clone(),ct,V.clone(),et,Z,nt,E()<.5,x)}else mt?P.lerp(Ke(E,O),T).normalize():Ke(E,P),w.add(H.clone(),P.clone(),Mn(P,E),et,Z,nt,E()<.5,x)}u&&u!=="none"&&R.push($i(D,z,v+W*13,u))}),R.concat(w.parts(y))}function lr({base:m=[0,0,0],rims:y=null,bottom:u=.6,top:f=6,radius:_=1.4,tiers:v=5,taper:T=.08,zone:b="leaf",core:x="leafCore",card:S=.5,density:E=1,seed:w=1,droop:R=25,whorl:C=.35,branches:L=9,trunk:P=.05,step:H=.3,lip:O=0,segs:V=12}={}){let F=Ve(w*104729+3),D=new Jn,z=[],W;if(Array.isArray(y)&&y.length)W=y.map(xt=>({y:+xt.y,r:+xt.r})).sort((xt,Mt)=>xt.y-Mt.y);else{let xt=Math.max(.1,f-u),Mt=xt/(v+.6);W=[];for(let Qt=0;Qt<v;Qt++){let te=u+Qt*Mt;W.push({y:te,r:_*(1-(te-u)/xt*(1-T))})}}let j=Math.max(f,W[W.length-1].y+.3),K=W[0].y,st=j-K,at=xt=>{if(xt<=W[0].y)return W[0].r;for(let Mt=0;Mt<W.length;Mt++){let Qt=Mt+1<W.length?W[Mt+1].y:j;if(xt<=Qt){let te=(xt-W[Mt].y)/Math.max(1e-6,Qt-W[Mt].y);return Mt+1<W.length?W[Mt].r*(1-H*te):W[Mt].r*Math.max(.05,1-(1-T)*te)}}return .05*W[W.length-1].r},gt=xt=>Math.max(.012,P*(1-.8*(xt-K)/st)),mt=new A,_t=new A,et=new A,Z=new A,nt=new A,pt=new A,ct=new A,Ft=(xt,Mt,Qt,te)=>{let Jt=new A().subVectors(Mt,xt);if(Jt.length()<1e-4)return;Jt.normalize();let Re=new A(-Jt.z,0,Jt.x).normalize(),_e=new A().crossVectors(Jt,Re).normalize(),Qn=(Lt,zt)=>[30,150,270].map(Qe=>{let xe=Qe*Math.PI/180;return[Lt.x+(Re.x*Math.cos(xe)+_e.x*Math.sin(xe))*zt,Lt.y+(Re.y*Math.cos(xe)+_e.y*Math.sin(xe))*zt,Lt.z+(Re.z*Math.cos(xe)+_e.z*Math.sin(xe))*zt]}),bn=Qn(xt,Qt),Ce=Qn(Mt,te);for(let Lt=0;Lt<3;Lt++){let zt=(Lt+1)%3;z.push(...bn[Lt],...Ce[Lt],...Ce[zt],...bn[Lt],...Ce[zt],...bn[zt])}},Pt=[];for(let xt=K,Mt=0;xt<j-.06*st;Mt++)Pt.push(xt),xt+=C*(.85+.3*F());let ge=Pt.length;Pt.forEach((xt,Mt)=>{let Qt=at(xt),te=gt(xt),Jt=(xt-K)/st,ee=Math.max(3,Math.round(L*E*(.45+.55*(1-Jt)))),Re=Jt>.85,_e=S*(1-.45*Jt),Qn=R*(1-.4*Jt),bn=F()*Math.PI*2;for(let Ce=0;Ce<ee;Ce++){if(F()<.08)continue;let Lt=bn+(Ce+.5)/ee*Math.PI*2+(F()-.5)*.5*Math.PI*2/ee,zt=Math.max(.5*_e,(Qt*(1+O)-te)*(.85+.3*F())),Qe=((Re?-15:Qn)+16*(F()-.5))*Math.PI/180,xe=Qe-(22+12*F())*Math.PI/180;pt.set(-Math.sin(Lt),0,Math.cos(Lt));let ti=new A(m[0]+Math.cos(Lt)*te*.6,xt,m[2]+Math.sin(Lt)*te*.6),Sn=ti.clone().add(new A(Math.cos(Lt)*Math.cos(Qe),-Math.sin(Qe),Math.sin(Lt)*Math.cos(Qe)).multiplyScalar(.55*zt)),cr=Sn.clone().add(new A(Math.cos(Lt)*Math.cos(xe),-Math.sin(xe),Math.sin(Lt)*Math.cos(xe)).multiplyScalar(.45*zt)),ei=.014+.044*Math.pow(1-Jt,1.3)*Math.min(1,zt/1.5);Ft(ti,Sn,ei,.55*ei),Ft(Sn,cr,.55*ei,.12*ei);let hh=Math.max(2,Math.round(E*zt/(.5*S))),ji=Math.floor(F()*me.length),ha=new A(0,1,0),tn=new A,Qi=new A,ts=(en,$t,He,Tn,wn,es,ns=He*.75)=>{Qi.set(-$t.z,0,$t.x).normalize(),_t.copy(en).addScaledVector($t,ns),et.crossVectors($t,Qi).normalize().applyAxisAngle($t,1.8*(F()-.5)),D.add(_t.clone(),et.clone(),nt.crossVectors(et,$t).clone(),He,Tn,wn,F()<.5),es&&(Z.copy(Qi).applyAxisAngle($t,.6*(F()-.5)),D.add(_t.clone(),Z.clone(),nt.crossVectors(Z,$t).clone(),He,Tn*.9,wn,F()<.5))};(Ce%2===0||Jt>.6)&&(tn.copy(new A(Math.cos(Lt),1.4,Math.sin(Lt))).normalize(),ts(ti,tn,_e*.4,_e*.4,ji,!0));let En=.08*zt;for(let en=0;En<zt&&en<12;en++){let $t=En/zt,He=$t>.55,Tn=He?Sn:ti,wn=He?cr:Sn,es=He?($t-.55)/.45:$t/.55;ct.lerpVectors(Tn,wn,Math.min(1,es)),mt.subVectors(wn,Tn).normalize();let ns=(8+10*F())*Math.PI/180;mt.applyAxisAngle(pt,-ns*Math.sign(pt.x*mt.z-pt.z*mt.x||1)).normalize();let hr=1.15-.7*Math.min(1,$t),Ge=_e*.5*(.85+.35*F())*hr,is=En+1.9*Ge>=zt;is&&(Ge=Math.max(.3*_e*.5,Math.min(Ge,(zt-En)/1.4)));let ur=_e*.5*hr*(is?.7:1);if(ts(ct,mt,Ge,ur,(ji+en)%me.length,!0,Ge*.7),$t>.45&&!is)for(let ua of[1,-1])tn.copy(mt).applyAxisAngle(ha,ua*(.5+.25*F())).normalize(),tn.y-=.18+.1*F(),tn.normalize(),ts(ct,tn,Ge*.8,ur*.85,(ji+en+2)%me.length,!1);En+=1.5*Ge}}});let je=j-.3*S,Kn=.35*S,Ki=.35*S;for(let xt=0;xt<3;xt++){let Mt=xt*Math.PI/3;D.add(new A(m[0],je,m[2]),new A(Math.cos(Mt),0,Math.sin(Mt)),new A(-Math.sin(Mt),0,Math.cos(Mt)),Kn,Ki,Math.floor(F()*me.length),!1)}let jn=D.parts(b);return z.length&&jn.push({g:vn(z),zone:x,tone:.32}),jn}return{HD_ENV:o,KINDS:t,MATERIAL_FIELDS:e,HD_BUDGET:n,hdTriBudget:i,noise3:h,fbm3:d,finishShapesPattern:B,mapsFor:N,materialFor:X,animate:Q,fireBounds:tt,boxUV:dt,boxUVInto:lt,smoothByAngle:yt,wrinkle:ot,assemble:Dt,keepSeeThrough:St,dress:Et,guessMaterials:Xt,dressByAlbedo:vt,sweepTubePositions:re,weltPositions:he,lathePositions:Zt,chamferedBox:$e,arc:ke,posGeo:vn,canopy:$n,conifer:lr}})(),aa=(()=>{let{assemble:o,posGeo:t}=nh,e="hd",n={"plaster-oak":{carcass:"#E3CBA5",interior:"#D2B084",bookTeal:"#3E7C86",bookRust:"#C4623F",bookSage:"#7E9179",brass:"#C9A24B"},"chalk-white":{carcass:"#F8F4EF",interior:"#ECE7E0",bookTeal:"#3E7C86",bookRust:"#C4623F",bookSage:"#5B8551",brass:"#C9A24B"},"sage-fitted":{carcass:"#E3E6E4",interior:"#A89A85",bookTeal:"#3E7C86",bookRust:"#7A4A5E",bookSage:"#5B8551",brass:"#D9A02B"},"warm-walnut":{carcass:"#B8946A",interior:"#4E3423",bookTeal:"#D9A02B",bookRust:"#C4623F",bookSage:"#7E9179",brass:"#E0C078"}},i=n["plaster-oak"],s={carcass:{kind:"paint",finish:"matte",crease:40,describe:"eggshell paint over the joinery: scribed sides, cap and cove, arrised shelves, rails, stile and the shaker doors"},interior:{kind:"paint",finish:"matte",describe:"the back board, painted one rung darker than the case"},bookTeal:{kind:"paper",finish:"plain",describe:"paper-covered hardbacks, each book its own shade"},bookRust:{kind:"paper",finish:"plain",describe:"paper-covered hardbacks, each book its own shade"},bookSage:{kind:"paper",finish:"plain",describe:"paper-covered hardbacks; also the volumes laid flat"},brass:{kind:"metal",finish:"brushed",crease:60,describe:"brushed brass: the two turned door knobs"},pages:{kind:"paper",finish:"plain",describe:"the cream page block seen on the top of every book and the ends of the flat piles: a fitting, not a colour zone"}},r="#EADFC6",l={colorway:{type:"choice",default:"plaster-oak",label:"Colorway",options:["plaster-oak","chalk-white","sage-fitted","warm-walnut"],describe:"Curated kit-coherent scheme; sets all seven zone colours at once. plaster-oak is the approved pale painted oak with teal/rust/sage spines; chalk-white is a crisp new-build white case; sage-fitted paints the joinery a grey-green and swaps the rust spine for plum; warm-walnut is a darker library \u2014 mid-oak case over a deep walnut back board with an ochre spine band. Every scheme keeps the same value ladder, so the thumbnail reads the same way."},carcass:{type:"color",default:i.carcass,label:"Carcass paint",describe:"Albedo of every painted joinery surface: the two scribed side panels, the top cap and its cove, the plinth, all shelf boards, the cupboard rails and stile and both door frames and panels. The dominant colour of the piece."},interior:{type:"color",default:i.interior,label:"Back board",describe:"Albedo of the back board seen behind the shelves and inside the cupboard. Keep it one value rung darker than the carcass or the shelves and books stop separating from the case at thumbnail size."},bookTeal:{type:"color",default:i.bookTeal,label:"Book band 1",describe:"First of the three book-spine bands. Bands are dealt these three tones in rotation along every shelf, so this colour appears on roughly a third of the books."},bookRust:{type:"color",default:i.bookRust,label:"Book band 2",describe:"Second book-spine band \u2014 the kit accent colour, deliberately confined to the books so a room assembled from twenty parts still reads as designed."},bookSage:{type:"color",default:i.bookSage,label:"Book band 3",describe:"Third book-spine band, and the colour used for the flat-laid stacks that appear in the shelf gaps as the lived-in knob rises."},brass:{type:"color",default:i.brass,label:"Knobs",describe:"Albedo of the two turned door knobs \u2014 the single small warm metal sparkle, brushed brass in the HD edition."},shelves:{type:"range",default:5,min:3,max:6,step:1,label:"Shelves",affects:"geometry",describe:"How many open shelf compartments fill the 1.50 m above the cupboard. REBUILDS: the intermediate boards are re-cut at a new constant pitch and a fresh book row is generated for every compartment, so the triangle count moves with the knob. 3 gives tall, airy display shelves; 6 gives a dense library grid of shallow compartments. Board stock stays 0.03 m at every value."},fill:{type:"range",default:.75,min:0,max:1,step:.05,label:"Fill",affects:"geometry",describe:"How full the shelves are. 0 strips every book out and ships the bare painted carcass; 0.25 leaves three short bands per shelf with wide daylight between the groups; 1 puts six wide bands per shelf and closes most of the air up. Changes the NUMBER of spine bands and how much of the shelf run they take, never their stock, so books read the same size at every setting."},lived_in:{type:"range",default:.35,min:0,max:1,step:.05,label:"Lived in",affects:"geometry",describe:"The kit-wide showroom-to-lived-in axis, and every bit of it is geometry. 0 is showroom: every band bolt upright, spines flush to one plane, groups evenly spaced, doors square on their stops, crisp 20 mm arrises. At the 0.35 default the last band of each group has toppled 4-8 degrees into the air beside it, a couple of bands per shelf are shoved back off the front line, and three shelves carry a pile laid flat. By 1.0 the lean reaches 14 degrees, five shelves carry flat piles, the shut door hangs 14 degrees ajar and the carcass front arrises are knocked back to a 34 mm chamfer where the paint would wear off a corner."},doorOpen:{type:"range",default:1,min:0,max:1,step:.05,label:"Door open",affects:"geometry",describe:"How far the right-hand lower door stands open, as a fraction of its 90 degree swing about the jamb. 1 is the approved hero pose \u2014 the leaf square out from the carcass, the cupboard interior and the centre stile on show. 0.35 is part-closed, a leaf ajar with the panel catching the room. 0 shuts it onto its stop so the base reads as a closed painted cupboard. The left leaf stays shut throughout (the lived_in knob is what cracks that one), so the asymmetry the piece is built around survives every value. The DEFAULT sits at the maximum on purpose: 90 degrees of swing is all the 1 m module has room for before the leaf crosses its own cell edge, so this knob can only shed, never add."},doors:{type:"toggle",default:!0,label:"Cupboard doors",affects:"geometry",describe:"On, the base is a two-door cupboard with a centre stile and two turned brass knobs. Off, both leaves and their knobs are deleted and a shelf board drops into the cupboard instead, turning the base into an open cubby that matches the shelving above. Off also removes the door rig groups."}},a=1,c=2.2,h=-.15,d=.15,p=.03,g=a/2-p,M=g+.01,I=.03,k=.14,G=-.14,B=.1,U=.13,N=.62,X=N+I,Y=c-.05,$=.02,q=.415,Q=.03,tt=.105,it=U+.008,dt=N-.008,lt=.45,yt=88,ot=.06,It=.205,wt=.1,Dt=-.455,St=.455,Et=-.04,Ct=.11,Xt=3,qt=12;function le(u=1){let f=u>>>0||1;return()=>(f=f*16807%2147483647)/2147483647}let Yt=(u,f,_)=>Math.max(f,Math.min(_,u));function ce(u,f,_,v,T){let b=_[0]-f[0],x=_[1]-f[1],S=_[2]-f[2],E=v[0]-f[0],w=v[1]-f[1],R=v[2]-f[2],C=x*R-S*w,L=S*E-b*R,P=b*w-x*E;C*C+L*L+P*P<1e-20||(T&&C*T[0]+L*T[1]+P*T[2]<0?u.push(...f,...v,..._):u.push(...f,..._,...v))}function vt(u,f,_,v,T,b){ce(u,f,_,v,b),ce(u,f,v,T,b)}let re=(u,f,_)=>[u,_,f],he=(u,f,_)=>[_,f,u];function Zt(u,f,_,v,{capA:T=!1,capB:b=!1,keep:x=null}={}){let S=u,E=0;for(let C=0;C<S.length;C++){let L=S[C],P=S[(C+1)%S.length];E+=L[0]*P[1]-P[0]*L[1]}E<0&&(S=[...S].reverse());let w=[],R=(_+v)/2;for(let C=0;C<S.length;C++){let L=S[C],P=S[(C+1)%S.length];if(x&&!x(L,P))continue;let H=P[0]-L[0],O=P[1]-L[1],V=(L[0]+P[0])/2,F=(L[1]+P[1])/2,D=f(V,F,R),z=f(V+O,F-H,R),W=[z[0]-D[0],z[1]-D[1],z[2]-D[2]];vt(w,f(L[0],L[1],_),f(P[0],P[1],_),f(P[0],P[1],v),f(L[0],L[1],v),W)}if(T||b){let C=f(0,0,_),L=f(0,0,v),P=[C[0]-L[0],C[1]-L[1],C[2]-L[2]],H=[-P[0],-P[1],-P[2]];for(let O of yn.triangulateShape(S.map(([V,F])=>new bt(V,F)),[]))T&&ce(w,f(...S[O[0]],_),f(...S[O[1]],_),f(...S[O[2]],_),P),b&&ce(w,f(...S[O[0]],v),f(...S[O[1]],v),f(...S[O[2]],v),H)}return w}function $e(u,f,_,v,T){for(let b of yn.triangulateShape(f.map(([x,S])=>new bt(x,S)),[]))ce(u,_(...f[b[0]],v),_(...f[b[1]],v),_(...f[b[2]],v),T)}function ke(u,f,_,v,T,b){let x=(E,w,R)=>{let C=Math.cos(R),L=Math.sin(R);return[0,1,2].map(P=>_[P]+v[P]*w+(T[P]*C+b[P]*L)*E)},S=[];for(let E=0;E<u.length-1;E++){let[w,R]=u[E],[C,L]=u[E+1],P=L-R,H=-(C-w);for(let O=0;O<f;O++){let V=O/f*Math.PI*2,F=(O+1)/f*Math.PI*2,D=(V+F)/2,z=Math.cos(D),W=Math.sin(D),j=[0,1,2].map(K=>(T[K]*z+b[K]*W)*P+v[K]*H);vt(S,x(w,R,V),x(w,R,F),x(C,L,F),x(C,L,V),j)}}return S}function vn(u,f,_,v,T){return[[_,u],[v-T,u],[v,u+T],[v,f-T],[v-T,f],[_,f]]}function Ve(u,f,_){let v=(T,b)=>!(Math.abs(T[0]-G)<1e-9&&Math.abs(b[0]-G)<1e-9);return t(Zt(vn(u,f,G,k,_),he,-M,M,{keep:v}))}function me(u,f,_,v,T){let b=[],x=-u;for(let S=0;S<f.length;S++){let E=S===f.length-1?0:x+f[S],w=_[S],R=[],C=[];vt(R,[x,0,T],[E,0,T],[E,w,T],[x,w,T],[0,0,1]),vt(C,[x,w,v],[E,w,v],[E,w,T],[x,w,T],[0,1,0]);let L=S===0?0:_[S-1],P=S===f.length-1?0:_[S+1];w>L+1e-4&&vt(R,[x,L,v],[x,L,T],[x,w,T],[x,w,v],[-1,0,0]),w>P+1e-4&&vt(R,[E,P,v],[E,P,T],[E,w,T],[E,w,v],[1,0,0]),b.push({cover:R,pages:C}),x=E}return b}function Ke(u){let f=[],_=[];return vt(f,[u.x0,u.y1,u.z0],[u.x1,u.y1,u.z0],[u.x1,u.y1,u.z1],[u.x0,u.y1,u.z1],[0,1,0]),vt(f,[u.x0,u.y0,u.z1],[u.x1,u.y0,u.z1],[u.x1,u.y1,u.z1],[u.x0,u.y1,u.z1],[0,0,1]),vt(_,[u.x0,u.y0,u.z0],[u.x0,u.y0,u.z1],[u.x0,u.y1,u.z1],[u.x0,u.y1,u.z0],[-1,0,0]),vt(_,[u.x1,u.y0,u.z0],[u.x1,u.y0,u.z1],[u.x1,u.y1,u.z1],[u.x1,u.y1,u.z0],[1,0,0]),{cover:f,pages:_}}function Mn(u,f,_){let v=[[.01,_-.002],[.026,ot-.007],[.021,ot]],T=ke(v,qt,[u,f,0],[0,0,1],[1,0,0],[0,1,0]),b=[];for(let x=0;x<qt;x++){let S=x/qt*Math.PI*2;b.push([u+.021*Math.cos(S),f+.021*Math.sin(S),ot])}for(let x=1;x<qt-1;x++)ce(T,b[0],b[x],b[x+1],[0,0,1]);return t(T)}function Jn(u){let f=[],_=O=>O*u,v=q,T=dt-it,b=.055,x=Q,S=.01,E=(O,V)=>{let F=[],D=[Math.sign(O-V),0,0],z=[Math.sign(V-O),0,0];return vt(F,[O,0,x],[V,0,x],[V,T,x],[O,T,x],[0,0,1]),vt(F,[O,0,0],[O,0,x],[O,T,x],[O,T,0],D),vt(F,[V,b,S],[V,b,x],[V,T-b,x],[V,T-b,S],z),t(F)};f.push({g:E(_(-v),_(-v+b)),zone:"carcass",grain:"y",tone:1,shift:.11+.3*(u>0)}),f.push({g:E(_(0),_(-b)),zone:"carcass",grain:"y",tone:.99,shift:.47+.3*(u>0)});let w=_(-v+b),R=_(-b),C=_(-v),L=_(0),P=(O,V)=>{let F=[],D=[0,Math.sign(O-V),0],z=[0,Math.sign(V-O),0];return vt(F,[w,O,x],[R,O,x],[R,V,x],[w,V,x],[0,0,1]),vt(F,[C,O,0],[L,O,0],[L,O,x],[C,O,x],D),vt(F,[w,V,S],[R,V,S],[R,V,x],[w,V,x],z),t(F)};f.push({g:P(0,b),zone:"carcass",grain:"x",tone:1.012,shift:.63}),f.push({g:P(T,T-b),zone:"carcass",grain:"x",tone:1.008,shift:.29});let H=[];return vt(H,[w,b,S],[R,b,S],[R,T-b,S],[w,T-b,S],[0,0,1]),vt(H,[C,0,0],[L,0,0],[L,T,0],[C,T,0],[0,0,-1]),f.push({g:t(H),zone:"carcass",grain:"y",tone:.975,shift:.81}),f.push({g:Mn(_(-v+b/2),T*.5,x),zone:"brass",grain:"x"}),f}function $i(u,f,_,v,T,b,x){let S=le(1013+u*7919),E=le(4241+u*3571),w=["bookTeal","bookRust","bookSage"],R=(Z,nt,pt)=>{let ct=.78+.34*E(),Ft=E(),Pt=t(Z.cover),ge=t(Z.pages);pt&&(Pt.applyMatrix4(pt),ge.applyMatrix4(pt)),x.push({g:Pt,zone:nt,grain:"y",tone:ct,shift:Ft}),x.push({g:ge,zone:"pages",grain:"z",tone:.96+.06*E(),shift:E()})};if(v<=.001)return;let C=Yt(Math.round(3+v*3),3,6),L=St-Dt,P=.008,H=.155,O=L-(b?H:0),V=O*(.34+.4*v),F=C<=3||S()<.45?2:3,D=[];for(let Z=0,nt=C;Z<F;Z++){let pt=F-Z-1,ct=Z===F-1?nt:1+Math.floor(S()*(nt-pt));D.push(ct),nt-=ct}let z=[],W=[];for(let Z=0;Z<C;Z++)z.push(.5+S()*1.4),W.push(.62+S()*.3);let j=z.reduce((Z,nt)=>Z+nt,0),K=z.map(Z=>Math.max(.038,Z/j*V)),st=[];for(let Z=0;Z<=F;Z++){let nt=Z===0||Z===F?.55:1.7;st.push(Math.max(.08,nt*(1+T*(S()*1.8-.7))))}let at=st.reduce((Z,nt)=>Z+nt,0),gt=Math.max(.02,O-K.reduce((Z,nt)=>Z+nt,0)-P*(C-F));for(let Z=0;Z<=F;Z++)st[Z]=st[Z]/at*gt;let mt=b?1+u%(F-1):-1;mt>0&&(st[mt]+=H);let _t=Dt+st[0],et=0;for(let Z=0;Z<F;Z++){for(let nt=0;nt<D[Z];nt++,et++){let pt=nt===D[Z]-1,ct=K[et],Ft=_*Math.min(.92,W[et]),Pt=pt?st[Z+1]:P,ge=pt&&W[et]<=.85&&Pt>=.03?Math.sqrt(T)*(7+S()*7)*Math.PI/180:0,je=Math.max(.005,ct*Math.sin(ge)+.003),Kn=S()<.45?-(.02+S()*.05)*T:0,Ki=w[(et+u)%3],jn=new Ht().makeTranslation(_t+ct,f-je,0).multiply(new Ht().makeRotationZ(-ge)),xt=Yt(Math.round(ct/.027),1,7),Mt=[],Qt=[];for(let ee=0;ee<xt;ee++)Mt.push(.7+.6*E()),Qt.push(Ft*(xt===1?1:.86+.14*E()));let te=Mt.reduce((ee,Re)=>ee+Re,0),Jt=Mt.map(ee=>ct*ee/te);for(let ee of me(ct,Jt,Qt,Et+Kn,Ct+Kn))R(ee,Ki,jn);_t+=ct+(pt?0:P)}if(Z+1===mt){let nt=_t+.022,pt=H-.048;[{x0:nt,x1:nt+pt,y0:f-.001,y1:f+.024,z0:Et+.015,z1:Ct-.012},{x0:nt+.007,x1:nt+pt-.005,y0:f+.0235,y1:f+.046,z0:Et+.022,z1:Ct-.021}].forEach((Ft,Pt)=>R(Ke(Ft),w[(Pt+u+1)%3],null))}_t+=st[Z+1]}}function $n(u={}){let f=n[u.colorway]||i,_={carcass:u.carcass??f.carcass,interior:u.interior??f.interior,bookTeal:u.bookTeal??f.bookTeal,bookRust:u.bookRust??f.bookRust,bookSage:u.bookSage??f.bookSage,brass:u.brass??f.brass,pages:r},v=Yt(Math.round(u.shelves??l.shelves.default),l.shelves.min,l.shelves.max),T=Yt(u.fill??l.fill.default,0,1),b=Yt(u.lived_in??l.lived_in.default,0,1),x=Yt(u.doorOpen??l.doorOpen.default,0,1),S=u.doors??l.doors.default,E=[],w=(D,z,W,j=1,K=0)=>E.push({g:D,zone:z,grain:W,tone:j,shift:K}),R=Math.min(.02+b*.014,p-.008),C=[[g,h],[a/2,h],[a/2,d-R],[a/2-R,d],[g,d]];w(t(Zt(C,re,0,Y,{capA:!0})),"carcass","y",1,.13),w(t(Zt(C.map(([D,z])=>[-D,z]),re,0,Y,{capA:!0})),"carcass","y",.99,.58);{let D=h+.02,z=[];vt(z,[-g,0,D],[g,0,D],[g,Y,D],[-g,Y,D],[0,0,1]),vt(z,[-g,0,h],[g,0,h],[g,Y,h],[-g,Y,h],[0,0,-1]),vt(z,[-g,0,h],[g,0,h],[g,0,D],[-g,0,D],[0,-1,0]),w(t(z),"interior","y")}{let D=[];vt(D,[-M,0,wt],[M,0,wt],[M,B,wt],[-M,B,wt],[0,0,1]),vt(D,[-g,0,h+.02],[g,0,h+.02],[g,0,wt],[-g,0,wt],[0,-1,0]),w(t(D),"carcass","x",.97,.4)}let L=.005+b*.003;w(Ve(B,U,L),"carcass","x",1.01,.21),w(Ve(N,X,L),"carcass","x",.99,.66);{let D=.025+b*.013,z=[[h,Y],[It,Y],[It,c-D],[It-D,c],[h,c]];w(t(Zt(z,he,-a/2,a/2,{capA:!0,capB:!0})),"carcass","x",1.015,.35);let W=.02,j=[[d,Y],[d,Y-W]];for(let at=1;at<=Xt;at++){let gt=Math.PI-at/Xt*Math.PI/2;j.push([d+W+W*Math.cos(gt),Y-W+W*Math.sin(gt)])}let K=at=>Math.abs(at[0]-d)<1e-9,st=at=>Math.abs(at[1]-Y)<1e-9;w(t(Zt(j,he,-a/2+5e-4,a/2-5e-4,{capA:!0,capB:!0,keep:(at,gt)=>!(K(at)&&K(gt))&&!(st(at)&&st(gt))})),"carcass","x",.985,.72)}let P=(Y-X)/v;for(let D=1;D<v;D++){let z=X+D*P;w(Ve(z-I/2,z+I/2,L),"carcass","x",[1,.985,1.012,.992,1.006][D%5],D*.19)}if(S){let z=[[-$,-.12],[$,-.12],[$,.1],[-$,.1]],W=(j,K)=>!(j[1]===-.12&&K[1]===-.12);w(t(Zt(z,re,B+.01,N+.02,{keep:W})),"carcass","y",.995,.84)}else{let D=(U+N)/2;w(Ve(D-I/2,D+I/2,L),"carcass","x",1,.52)}let H=[],O=[.12,.22,.32,.6,.85].filter(D=>b>=D).length,V=[2,0,4,1,3,5];for(let D=0;D<v;D++){let z=D===0?X:X+D*P+I/2,W=D===v-1?Y:X+(D+1)*P-I/2,j=V.indexOf(D),K=j>-1&&j<O&&T>.001;$i(D,z,W-z,T,b,K,H)}let F=new _n;if(F.name="alcove-bookcase",F.add(o(E,{name:"case",colors:_,materials:s})),H.length&&F.add(o(H,{name:"books",colors:_,materials:s})),S){let z=[-(b>.5?(b-.5)*2*14:0),x*yt];for(let[W,j]of[[0,-1],[1,1]]){let K=z[W]*Math.PI/180,st=Jn(j);for(let gt of st)gt.g.rotateY(K);let at=o(st,{name:j<0?"door-l":"door-r",colors:_,materials:s});at.position.set(j*lt,it,tt),F.add(at)}}return F}return{edition:e,presets:n,materials:s,params:l,createAsset:$n,rig:{"door-l":{axis:"y",range:[0,-88]},"door-r":{axis:"y",range:[0,-70]}},detach:["books"],night:{},default:$n}})(),{createAsset:oa,detach:T0,edition:w0,materials:A0,night:R0,params:la,presets:C0,rig:I0}=aa,P0=aa.default;var sh=oa,rh=la||{},ca=Object.entries(rh).flatMap(([o,t])=>{if(!t||!["choice","range","integer","toggle","color"].includes(t.type))return[];let e={key:o,kind:t.type,label:t.label||o,hint:t.describe||""};if(t.type==="choice"){if(!Array.isArray(t.options)||!t.options.every(n=>typeof n=="string"))return[];e.options=t.options.map(n=>({value:n,label:n}))}if(t.type==="range"||t.type==="integer"){if(![t.min,t.max,t.step].every(Number.isFinite))return[];Object.assign(e,{min:t.min,max:t.max,step:t.step})}return[{...e,default:t.default}]}),ah={controls:ca.map(({default:o,...t})=>t)};function oh(o={}){let t=Object.fromEntries(ca.map(n=>[n.key,o[n.key]??n.default])),e=sh(o);return e.userData.design={applied:t},e}function lh(o){o.traverse(t=>{t.geometry?.dispose(),Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material?.dispose()})}return _a(ch);})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
