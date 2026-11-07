var PolyspoonRecipe=(()=>{var Ji=Object.defineProperty;var qr=Object.getOwnPropertyDescriptor;var Yr=Object.getOwnPropertyNames;var Zr=Object.prototype.hasOwnProperty;var Jr=(_,t)=>{for(var e in t)Ji(_,e,{get:t[e],enumerable:!0})},$r=(_,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Yr(t))!Zr.call(_,i)&&i!==e&&Ji(_,i,{get:()=>t[i],enumerable:!(n=qr(t,i))||n.enumerable});return _};var Kr=_=>$r(Ji({},"__esModule",{value:!0}),_);var Tc={};Jr(Tc,{createAsset:()=>Ec,disposeAsset:()=>wc,metadata:()=>bc});var gr=1;var _r=3,Fs=0,xr=1,Ae=2;var yr=1;var vr=100;var Mr=204,Sr=205;var _s=0,xs=1,ys=2,gi=3,vs=4,Ms=5,Ss=6,bs=7,Os=0,br=1,Er=2;var Bs=1,zs=2,ks=3,Vs=4,Hs=5,Gs=6,Ws=7;var Xs=300,wr=301,qs=302;var Tr=306,Nn=1e3,Ln=1001,Es=1002,ws=1003;var zi=1006;var ki=1008;var Ar=1009;var Rr=1015;var Vi=1023;var Un=2300,_i=2301,di=2302,Ts=2303,As=2400,Rs=2401,Cs=2402;var Cr=0;var Ys="",Zt="srgb",Is="srgb-linear",Ps="linear",pi="srgb";var mi=7680;var Ir=519;var Pr=35044;var Dn=2e3,Ls=2001;function Qr(_){for(let t=_.length-1;t>=0;--t)if(_[t]>=65535)return!0;return!1}function jr(_){return ArrayBuffer.isView(_)&&!(_ instanceof DataView)}function Ds(_){return document.createElementNS("http://www.w3.org/1999/xhtml",_)}var js={},xi=null;function Lr(_){let t=_[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=_[1];e&&e.isStackTrace?_[0]+=" "+e.getLocation():_[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return _}function Ut(..._){_=Lr(_);let t="THREE."+_.shift();if(xi)xi("warn",t,..._);else{let e=_[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,..._)}}function Ct(..._){_=Lr(_);let t="THREE."+_.shift();if(xi)xi("error",t,..._);else{let e=_[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,..._)}}function gn(..._){let t=_.join(" ");t in js||(js[t]=!0,Ut(..._))}var ta={[_s]:xs,[ys]:Ss,[vs]:bs,[gi]:Ms,[xs]:_s,[Ss]:ys,[bs]:vs,[Ms]:gi},Ue=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let i=n[t];if(i!==void 0){let s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let i=n.slice(0);for(let s=0,r=i.length;s<r;s++)i[s].call(this,t);t.target=null}}},Vt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Cc=Math.PI/180,ea=180/Math.PI;function Wn(){let _=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Vt[_&255]+Vt[_>>8&255]+Vt[_>>16&255]+Vt[_>>24&255]+"-"+Vt[t&255]+Vt[t>>8&255]+"-"+Vt[t>>16&15|64]+Vt[t>>24&255]+"-"+Vt[e&63|128]+Vt[e>>8&255]+"-"+Vt[e>>16&255]+Vt[e>>24&255]+Vt[n&255]+Vt[n>>8&255]+Vt[n>>16&255]+Vt[n>>24&255]).toLowerCase()}function ft(_,t,e){return Math.max(t,Math.min(e,_))}function na(_,t){return(_%t+t)%t}function $i(_,t,e){return(1-e)*_+e*t}function An(_,t){switch(t.constructor){case Float32Array:return _;case Uint32Array:return _/4294967295;case Uint16Array:return _/65535;case Uint8Array:case Uint8ClampedArray:return _/255;case Int32Array:return Math.max(_/2147483647,-1);case Int16Array:return Math.max(_/32767,-1);case Int8Array:return Math.max(_/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Yt(_,t){switch(t.constructor){case Float32Array:return _;case Uint32Array:return Math.round(_*4294967295);case Uint16Array:return Math.round(_*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(_*255);case Int32Array:return Math.round(_*2147483647);case Int16Array:return Math.round(_*32767);case Int8Array:return Math.round(_*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var wt=class _{static{_.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ft(this.x,t.x,e.x),this.y=ft(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ft(this.x,t,e),this.y=ft(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ft(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ft(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*n-r*i+t.x,this.y=s*i+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},we=class{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,r,o){let a=n[i+0],l=n[i+1],c=n[i+2],d=n[i+3],m=s[r+0],y=s[r+1],b=s[r+2],I=s[r+3];if(d!==I||a!==m||l!==y||c!==b){let N=a*m+l*y+c*b+d*I;N<0&&(m=-m,y=-y,b=-b,I=-I,N=-N);let B=1-o;if(N<.9995){let D=Math.acos(N),z=Math.sin(D);B=Math.sin(B*D)/z,o=Math.sin(o*D)/z,a=a*B+m*o,l=l*B+y*o,c=c*B+b*o,d=d*B+I*o}else{a=a*B+m*o,l=l*B+y*o,c=c*B+b*o,d=d*B+I*o;let D=1/Math.sqrt(a*a+l*l+c*c+d*d);a*=D,l*=D,c*=D,d*=D}}t[e]=a,t[e+1]=l,t[e+2]=c,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,i,s,r){let o=n[i],a=n[i+1],l=n[i+2],c=n[i+3],d=s[r],m=s[r+1],y=s[r+2],b=s[r+3];return t[e]=o*b+c*d+a*y-l*m,t[e+1]=a*b+c*m+l*d-o*y,t[e+2]=l*b+c*y+o*m-a*d,t[e+3]=c*b-o*d-a*m-l*y,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,i=t._y,s=t._z,r=t._order,o=Math.cos,a=Math.sin,l=o(n/2),c=o(i/2),d=o(s/2),m=a(n/2),y=a(i/2),b=a(s/2);switch(r){case"XYZ":this._x=m*c*d+l*y*b,this._y=l*y*d-m*c*b,this._z=l*c*b+m*y*d,this._w=l*c*d-m*y*b;break;case"YXZ":this._x=m*c*d+l*y*b,this._y=l*y*d-m*c*b,this._z=l*c*b-m*y*d,this._w=l*c*d+m*y*b;break;case"ZXY":this._x=m*c*d-l*y*b,this._y=l*y*d+m*c*b,this._z=l*c*b+m*y*d,this._w=l*c*d-m*y*b;break;case"ZYX":this._x=m*c*d-l*y*b,this._y=l*y*d+m*c*b,this._z=l*c*b-m*y*d,this._w=l*c*d+m*y*b;break;case"YZX":this._x=m*c*d+l*y*b,this._y=l*y*d+m*c*b,this._z=l*c*b-m*y*d,this._w=l*c*d-m*y*b;break;case"XZY":this._x=m*c*d-l*y*b,this._y=l*y*d-m*c*b,this._z=l*c*b+m*y*d,this._w=l*c*d+m*y*b;break;default:Ut("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],i=e[4],s=e[8],r=e[1],o=e[5],a=e[9],l=e[2],c=e[6],d=e[10],m=n+o+d;if(m>0){let y=.5/Math.sqrt(m+1);this._w=.25/y,this._x=(c-a)*y,this._y=(s-l)*y,this._z=(r-i)*y}else if(n>o&&n>d){let y=2*Math.sqrt(1+n-o-d);this._w=(c-a)/y,this._x=.25*y,this._y=(i+r)/y,this._z=(s+l)/y}else if(o>d){let y=2*Math.sqrt(1+o-n-d);this._w=(s-l)/y,this._x=(i+r)/y,this._y=.25*y,this._z=(a+c)/y}else{let y=2*Math.sqrt(1+d-n-o);this._w=(r-i)/y,this._x=(s+l)/y,this._y=(a+c)/y,this._z=.25*y}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ft(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,o=e._x,a=e._y,l=e._z,c=e._w;return this._x=n*c+r*o+i*l-s*a,this._y=i*c+r*a+s*o-n*l,this._z=s*c+r*l+n*a-i*o,this._w=r*c-n*o-i*a-s*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,s=t._z,r=t._w,o=this.dot(t);o<0&&(n=-n,i=-i,s=-s,r=-r,o=-o);let a=1-e;if(o<.9995){let l=Math.acos(o),c=Math.sin(l);a=Math.sin(a*l)/c,e=Math.sin(e*l)/c,this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this._onChangeCallback()}else this._x=this._x*a+n*e,this._y=this._y*a+i*e,this._z=this._z*a+s*e,this._w=this._w*a+r*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},A=class _{static{_.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(tr.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(tr.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=t.elements,r=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*r,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*r,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*r,this}applyQuaternion(t){let e=this.x,n=this.y,i=this.z,s=t.x,r=t.y,o=t.z,a=t.w,l=2*(r*i-o*n),c=2*(o*e-s*i),d=2*(s*n-r*e);return this.x=e+a*l+r*d-o*c,this.y=n+a*c+o*l-s*d,this.z=i+a*d+s*c-r*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ft(this.x,t.x,e.x),this.y=ft(this.y,t.y,e.y),this.z=ft(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ft(this.x,t,e),this.y=ft(this.y,t,e),this.z=ft(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ft(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,i=t.y,s=t.z,r=e.x,o=e.y,a=e.z;return this.x=i*a-s*o,this.y=s*r-n*a,this.z=n*o-i*r,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ki.copy(this).projectOnVector(t),this.sub(Ki)}reflect(t){return this.sub(Ki.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ft(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ki=new A,tr=new we,at=class _{static{_.prototype.isMatrix3=!0}constructor(t,e,n,i,s,r,o,a,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,o,a,l)}set(t,e,n,i,s,r,o,a,l){let c=this.elements;return c[0]=t,c[1]=i,c[2]=o,c[3]=e,c[4]=s,c[5]=a,c[6]=n,c[7]=r,c[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],o=n[3],a=n[6],l=n[1],c=n[4],d=n[7],m=n[2],y=n[5],b=n[8],I=i[0],N=i[3],B=i[6],D=i[1],z=i[4],U=i[7],q=i[2],J=i[5],$=i[8];return s[0]=r*I+o*D+a*q,s[3]=r*N+o*z+a*J,s[6]=r*B+o*U+a*$,s[1]=l*I+c*D+d*q,s[4]=l*N+c*z+d*J,s[7]=l*B+c*U+d*$,s[2]=m*I+y*D+b*q,s[5]=m*N+y*z+b*J,s[8]=m*B+y*U+b*$,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],a=t[6],l=t[7],c=t[8];return e*r*c-e*o*l-n*s*c+n*o*a+i*s*l-i*r*a}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],a=t[6],l=t[7],c=t[8],d=c*r-o*l,m=o*a-c*s,y=l*s-r*a,b=e*d+n*m+i*y;if(b===0)return this.set(0,0,0,0,0,0,0,0,0);let I=1/b;return t[0]=d*I,t[1]=(i*l-c*n)*I,t[2]=(o*n-i*r)*I,t[3]=m*I,t[4]=(c*e-i*a)*I,t[5]=(i*s-o*e)*I,t[6]=y*I,t[7]=(n*a-l*e)*I,t[8]=(r*e-n*s)*I,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,r,o){let a=Math.cos(s),l=Math.sin(s);return this.set(n*a,n*l,-n*(a*r+l*o)+r+t,-i*l,i*a,-i*(-l*r+a*o)+o+e,0,0,1),this}scale(t,e){return gn("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Qi.makeScale(t,e)),this}rotate(t){return gn("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Qi.makeRotation(-t)),this}translate(t,e){return gn("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Qi.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},Qi=new at,er=new at().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),nr=new at().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function ia(){let _={enabled:!0,workingColorSpace:Is,spaces:{},convert:function(i,s,r){return this.enabled===!1||s===r||!s||!r||(this.spaces[s].transfer===pi&&(i.r=Ee(i.r),i.g=Ee(i.g),i.b=Ee(i.b)),this.spaces[s].primaries!==this.spaces[r].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===pi&&(i.r=_n(i.r),i.g=_n(i.g),i.b=_n(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Ys?Ps:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,r){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return gn("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),_.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return gn("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),_.colorSpaceToWorking(i,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return _.define({[Is]:{primaries:t,whitePoint:n,transfer:Ps,toXYZ:er,fromXYZ:nr,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Zt},outputColorSpaceConfig:{drawingBufferColorSpace:Zt}},[Zt]:{primaries:t,whitePoint:n,transfer:pi,toXYZ:er,fromXYZ:nr,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Zt}}}),_}var ne=ia();function Ee(_){return _<.04045?_*.0773993808:Math.pow(_*.9478672986+.0521327014,2.4)}function _n(_){return _<.0031308?_*12.92:1.055*Math.pow(_,.41666)-.055}var rn,yi=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{rn===void 0&&(rn=Ds("canvas")),rn.width=t.width,rn.height=t.height;let i=rn.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=rn}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Ds("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let r=0;r<s.length;r++)s[r]=Ee(s[r]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ee(e[n]/255)*255):e[n]=Ee(e[n]);return{data:e,width:t.width,height:t.height}}else return Ut("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},sa=0,vi=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:sa++}),this.uuid=Wn(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let r=0,o=i.length;r<o;r++)i[r].isDataTexture?s.push(ji(i[r].image)):s.push(ji(i[r]))}else s=ji(i);n.url=s}return e||(t.images[this.uuid]=n),n}};function ji(_){return typeof HTMLImageElement<"u"&&_ instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&_ instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&_ instanceof ImageBitmap?yi.getDataURL(_):_.data?{data:Array.from(_.data),width:_.width,height:_.height,type:_.data.constructor.name}:(Ut("Texture: Unable to serialize Texture."),{})}var ra=0,ts=new A,Ye=class _ extends Ue{constructor(t=_.DEFAULT_IMAGE,e=_.DEFAULT_MAPPING,n=Ln,i=Ln,s=zi,r=ki,o=Vi,a=Ar,l=_.DEFAULT_ANISOTROPY,c=Ys){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ra++}),this.uuid=Wn(),this.name="",this.source=new vi(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=r,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=a,this.offset=new wt(0,0),this.repeat=new wt(1,1),this.center=new wt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new at,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ts).x}get height(){return this.source.getSize(ts).y}get depth(){return this.source.getSize(ts).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Ut(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Ut(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Xs)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Nn:t.x=t.x-Math.floor(t.x);break;case Ln:t.x=t.x<0?0:1;break;case Es:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Nn:t.y=t.y-Math.floor(t.y);break;case Ln:t.y=t.y<0?0:1;break;case Es:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ye.DEFAULT_IMAGE=null;Ye.DEFAULT_MAPPING=Xs;Ye.DEFAULT_ANISOTROPY=1;var xn=class _{static{_.prototype.isVector4=!0}constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i+r[12]*s,this.y=r[1]*e+r[5]*n+r[9]*i+r[13]*s,this.z=r[2]*e+r[6]*n+r[10]*i+r[14]*s,this.w=r[3]*e+r[7]*n+r[11]*i+r[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s,a=t.elements,l=a[0],c=a[4],d=a[8],m=a[1],y=a[5],b=a[9],I=a[2],N=a[6],B=a[10];if(Math.abs(c-m)<.01&&Math.abs(d-I)<.01&&Math.abs(b-N)<.01){if(Math.abs(c+m)<.1&&Math.abs(d+I)<.1&&Math.abs(b+N)<.1&&Math.abs(l+y+B-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let z=(l+1)/2,U=(y+1)/2,q=(B+1)/2,J=(c+m)/4,$=(d+I)/4,X=(b+N)/4;return z>U&&z>q?z<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(z),i=J/n,s=$/n):U>q?U<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(U),n=J/i,s=X/i):q<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(q),n=$/s,i=X/s),this.set(n,i,s,e),this}let D=Math.sqrt((N-b)*(N-b)+(d-I)*(d-I)+(m-c)*(m-c));return Math.abs(D)<.001&&(D=1),this.x=(N-b)/D,this.y=(d-I)/D,this.z=(m-c)/D,this.w=Math.acos((l+y+B-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ft(this.x,t.x,e.x),this.y=ft(this.y,t.y,e.y),this.z=ft(this.z,t.z,e.z),this.w=ft(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ft(this.x,t,e),this.y=ft(this.y,t,e),this.z=ft(this.z,t,e),this.w=ft(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ft(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var Gt=class _{static{_.prototype.isMatrix4=!0}constructor(t,e,n,i,s,r,o,a,l,c,d,m,y,b,I,N){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,o,a,l,c,d,m,y,b,I,N)}set(t,e,n,i,s,r,o,a,l,c,d,m,y,b,I,N){let B=this.elements;return B[0]=t,B[4]=e,B[8]=n,B[12]=i,B[1]=s,B[5]=r,B[9]=o,B[13]=a,B[2]=l,B[6]=c,B[10]=d,B[14]=m,B[3]=y,B[7]=b,B[11]=I,B[15]=N,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new _().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,i=1/an.setFromMatrixColumn(t,0).length(),s=1/an.setFromMatrixColumn(t,1).length(),r=1/an.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,i=t.y,s=t.z,r=Math.cos(n),o=Math.sin(n),a=Math.cos(i),l=Math.sin(i),c=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){let m=r*c,y=r*d,b=o*c,I=o*d;e[0]=a*c,e[4]=-a*d,e[8]=l,e[1]=y+b*l,e[5]=m-I*l,e[9]=-o*a,e[2]=I-m*l,e[6]=b+y*l,e[10]=r*a}else if(t.order==="YXZ"){let m=a*c,y=a*d,b=l*c,I=l*d;e[0]=m+I*o,e[4]=b*o-y,e[8]=r*l,e[1]=r*d,e[5]=r*c,e[9]=-o,e[2]=y*o-b,e[6]=I+m*o,e[10]=r*a}else if(t.order==="ZXY"){let m=a*c,y=a*d,b=l*c,I=l*d;e[0]=m-I*o,e[4]=-r*d,e[8]=b+y*o,e[1]=y+b*o,e[5]=r*c,e[9]=I-m*o,e[2]=-r*l,e[6]=o,e[10]=r*a}else if(t.order==="ZYX"){let m=r*c,y=r*d,b=o*c,I=o*d;e[0]=a*c,e[4]=b*l-y,e[8]=m*l+I,e[1]=a*d,e[5]=I*l+m,e[9]=y*l-b,e[2]=-l,e[6]=o*a,e[10]=r*a}else if(t.order==="YZX"){let m=r*a,y=r*l,b=o*a,I=o*l;e[0]=a*c,e[4]=I-m*d,e[8]=b*d+y,e[1]=d,e[5]=r*c,e[9]=-o*c,e[2]=-l*c,e[6]=y*d+b,e[10]=m-I*d}else if(t.order==="XZY"){let m=r*a,y=r*l,b=o*a,I=o*l;e[0]=a*c,e[4]=-d,e[8]=l*c,e[1]=m*d+I,e[5]=r*c,e[9]=y*d-b,e[2]=b*d-y,e[6]=o*c,e[10]=I*d+m}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(aa,t,oa)}lookAt(t,e,n){let i=this.elements;return $t.subVectors(t,e),$t.lengthSq()===0&&($t.z=1),$t.normalize(),Ie.crossVectors(n,$t),Ie.lengthSq()===0&&(Math.abs(n.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),Ie.crossVectors(n,$t)),Ie.normalize(),Kn.crossVectors($t,Ie),i[0]=Ie.x,i[4]=Kn.x,i[8]=$t.x,i[1]=Ie.y,i[5]=Kn.y,i[9]=$t.y,i[2]=Ie.z,i[6]=Kn.z,i[10]=$t.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,s=this.elements,r=n[0],o=n[4],a=n[8],l=n[12],c=n[1],d=n[5],m=n[9],y=n[13],b=n[2],I=n[6],N=n[10],B=n[14],D=n[3],z=n[7],U=n[11],q=n[15],J=i[0],$=i[4],X=i[8],tt=i[12],et=i[1],rt=i[5],ot=i[9],lt=i[13],vt=i[2],ct=i[6],Dt=i[10],Mt=i[14],It=i[3],xt=i[7],At=i[11],St=i[15];return s[0]=r*J+o*et+a*vt+l*It,s[4]=r*$+o*rt+a*ct+l*xt,s[8]=r*X+o*ot+a*Dt+l*At,s[12]=r*tt+o*lt+a*Mt+l*St,s[1]=c*J+d*et+m*vt+y*It,s[5]=c*$+d*rt+m*ct+y*xt,s[9]=c*X+d*ot+m*Dt+y*At,s[13]=c*tt+d*lt+m*Mt+y*St,s[2]=b*J+I*et+N*vt+B*It,s[6]=b*$+I*rt+N*ct+B*xt,s[10]=b*X+I*ot+N*Dt+B*At,s[14]=b*tt+I*lt+N*Mt+B*St,s[3]=D*J+z*et+U*vt+q*It,s[7]=D*$+z*rt+U*ct+q*xt,s[11]=D*X+z*ot+U*Dt+q*At,s[15]=D*tt+z*lt+U*Mt+q*St,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],r=t[1],o=t[5],a=t[9],l=t[13],c=t[2],d=t[6],m=t[10],y=t[14],b=t[3],I=t[7],N=t[11],B=t[15],D=a*y-l*m,z=o*y-l*d,U=o*m-a*d,q=r*y-l*c,J=r*m-a*c,$=r*d-o*c;return e*(I*D-N*z+B*U)-n*(b*D-N*q+B*J)+i*(b*z-I*q+B*$)-s*(b*U-I*J+N*$)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],i=t[8],s=t[1],r=t[5],o=t[9],a=t[2],l=t[6],c=t[10];return e*(r*c-o*l)-n*(s*c-o*a)+i*(s*l-r*a)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],a=t[6],l=t[7],c=t[8],d=t[9],m=t[10],y=t[11],b=t[12],I=t[13],N=t[14],B=t[15],D=e*o-n*r,z=e*a-i*r,U=e*l-s*r,q=n*a-i*o,J=n*l-s*o,$=i*l-s*a,X=c*I-d*b,tt=c*N-m*b,et=c*B-y*b,rt=d*N-m*I,ot=d*B-y*I,lt=m*B-y*N,vt=D*lt-z*ot+U*rt+q*et-J*tt+$*X;if(vt===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let ct=1/vt;return t[0]=(o*lt-a*ot+l*rt)*ct,t[1]=(i*ot-n*lt-s*rt)*ct,t[2]=(I*$-N*J+B*q)*ct,t[3]=(m*J-d*$-y*q)*ct,t[4]=(a*et-r*lt-l*tt)*ct,t[5]=(e*lt-i*et+s*tt)*ct,t[6]=(N*U-b*$-B*z)*ct,t[7]=(c*$-m*U+y*z)*ct,t[8]=(r*ot-o*et+l*X)*ct,t[9]=(n*et-e*ot-s*X)*ct,t[10]=(b*J-I*U+B*D)*ct,t[11]=(d*U-c*J-y*D)*ct,t[12]=(o*tt-r*rt-a*X)*ct,t[13]=(e*rt-n*tt+i*X)*ct,t[14]=(I*z-b*q-N*D)*ct,t[15]=(c*q-d*z+m*D)*ct,this}scale(t){let e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),i=Math.sin(e),s=1-n,r=t.x,o=t.y,a=t.z,l=s*r,c=s*o;return this.set(l*r+n,l*o-i*a,l*a+i*o,0,l*o+i*a,c*o+n,c*a-i*r,0,l*a-i*o,c*a+i*r,s*a*a+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,r){return this.set(1,n,s,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){let i=this.elements,s=e._x,r=e._y,o=e._z,a=e._w,l=s+s,c=r+r,d=o+o,m=s*l,y=s*c,b=s*d,I=r*c,N=r*d,B=o*d,D=a*l,z=a*c,U=a*d,q=n.x,J=n.y,$=n.z;return i[0]=(1-(I+B))*q,i[1]=(y+U)*q,i[2]=(b-z)*q,i[3]=0,i[4]=(y-U)*J,i[5]=(1-(m+B))*J,i[6]=(N+D)*J,i[7]=0,i[8]=(b+z)*$,i[9]=(N-D)*$,i[10]=(1-(m+I))*$,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){let i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];let s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let r=an.set(i[0],i[1],i[2]).length(),o=an.set(i[4],i[5],i[6]).length(),a=an.set(i[8],i[9],i[10]).length();s<0&&(r=-r),re.copy(this);let l=1/r,c=1/o,d=1/a;return re.elements[0]*=l,re.elements[1]*=l,re.elements[2]*=l,re.elements[4]*=c,re.elements[5]*=c,re.elements[6]*=c,re.elements[8]*=d,re.elements[9]*=d,re.elements[10]*=d,e.setFromRotationMatrix(re),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,i,s,r,o=Dn,a=!1){let l=this.elements,c=2*s/(e-t),d=2*s/(n-i),m=(e+t)/(e-t),y=(n+i)/(n-i),b,I;if(a)b=s/(r-s),I=r*s/(r-s);else if(o===Dn)b=-(r+s)/(r-s),I=-2*r*s/(r-s);else if(o===Ls)b=-r/(r-s),I=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=m,l[12]=0,l[1]=0,l[5]=d,l[9]=y,l[13]=0,l[2]=0,l[6]=0,l[10]=b,l[14]=I,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,s,r,o=Dn,a=!1){let l=this.elements,c=2/(e-t),d=2/(n-i),m=-(e+t)/(e-t),y=-(n+i)/(n-i),b,I;if(a)b=1/(r-s),I=r/(r-s);else if(o===Dn)b=-2/(r-s),I=-(r+s)/(r-s);else if(o===Ls)b=-1/(r-s),I=-s/(r-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=0,l[12]=m,l[1]=0,l[5]=d,l[9]=0,l[13]=y,l[2]=0,l[6]=0,l[10]=b,l[14]=I,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},an=new A,re=new Gt,aa=new A(0,0,0),oa=new A(1,1,1),Ie=new A,Kn=new A,$t=new A,ir=new Gt,sr=new we,Ze=class _{constructor(t=0,e=0,n=0,i=_.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let i=t.elements,s=i[0],r=i[4],o=i[8],a=i[1],l=i[5],c=i[9],d=i[2],m=i[6],y=i[10];switch(e){case"XYZ":this._y=Math.asin(ft(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,y),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(m,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ft(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,y),this._z=Math.atan2(a,l)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(ft(m,-1,1)),Math.abs(m)<.9999999?(this._y=Math.atan2(-d,y),this._z=Math.atan2(-r,l)):(this._y=0,this._z=Math.atan2(a,s));break;case"ZYX":this._y=Math.asin(-ft(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(m,y),this._z=Math.atan2(a,s)):(this._x=0,this._z=Math.atan2(-r,l));break;case"YZX":this._z=Math.asin(ft(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-c,l),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,y));break;case"XZY":this._z=Math.asin(-ft(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(m,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-c,y),this._y=0);break;default:Ut("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return ir.makeRotationFromQuaternion(t),this.setFromRotationMatrix(ir,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return sr.setFromEuler(this),this.setFromQuaternion(sr,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ze.DEFAULT_ORDER="XYZ";var Mi=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},la=0,rr=new A,on=new we,ye=new Gt,Qn=new A,Rn=new A,ca=new A,ha=new we,ar=new A(1,0,0),or=new A(0,1,0),lr=new A(0,0,1),cr={type:"added"},ua={type:"removed"},ln={type:"childadded",child:null},es={type:"childremoved",child:null},Te=class _ extends Ue{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:la++}),this.uuid=Wn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=_.DEFAULT_UP.clone();let t=new A,e=new Ze,n=new we,i=new A(1,1,1);function s(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Gt},normalMatrix:{value:new at}}),this.matrix=new Gt,this.matrixWorld=new Gt,this.matrixAutoUpdate=_.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=_.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Mi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return on.setFromAxisAngle(t,e),this.quaternion.multiply(on),this}rotateOnWorldAxis(t,e){return on.setFromAxisAngle(t,e),this.quaternion.premultiply(on),this}rotateX(t){return this.rotateOnAxis(ar,t)}rotateY(t){return this.rotateOnAxis(or,t)}rotateZ(t){return this.rotateOnAxis(lr,t)}translateOnAxis(t,e){return rr.copy(t).applyQuaternion(this.quaternion),this.position.add(rr.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(ar,t)}translateY(t){return this.translateOnAxis(or,t)}translateZ(t){return this.translateOnAxis(lr,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ye.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Qn.copy(t):Qn.set(t,e,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Rn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ye.lookAt(Rn,Qn,this.up):ye.lookAt(Qn,Rn,this.up),this.quaternion.setFromRotationMatrix(ye),i&&(ye.extractRotation(i.matrixWorld),on.setFromRotationMatrix(ye),this.quaternion.premultiply(on.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Ct("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(cr),ln.child=t,this.dispatchEvent(ln),ln.child=null):Ct("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(ua),es.child=t,this.dispatchEvent(es),es.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ye.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ye.multiply(t.parent.matrixWorld)),t.applyMatrix4(ye),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(cr),ln.child=t,this.dispatchEvent(ln),ln.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){let r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let i=this.children;for(let s=0,r=i.length;s<r;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rn,t,ca),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rn,ha,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,i=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*i,s[13]+=n-s[1]*e-s[5]*n-s[9]*i,s[14]+=i-s[2]*e-s[6]*n-s[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(o,a){return o[a.uuid]===void 0&&(o[a.uuid]=a.toJSON(t)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let a=o.shapes;if(Array.isArray(a))for(let l=0,c=a.length;l<c;l++){let d=a[l];s(t.shapes,d)}else s(t.shapes,a)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let a=0,l=this.material.length;a<l;a++)o.push(s(t.materials,this.material[a]));i.material=o}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let a=this.animations[o];i.animations.push(s(t.animations,a))}}if(e){let o=r(t.geometries),a=r(t.materials),l=r(t.textures),c=r(t.images),d=r(t.shapes),m=r(t.skeletons),y=r(t.animations),b=r(t.nodes);o.length>0&&(n.geometries=o),a.length>0&&(n.materials=a),l.length>0&&(n.textures=l),c.length>0&&(n.images=c),d.length>0&&(n.shapes=d),m.length>0&&(n.skeletons=m),y.length>0&&(n.animations=y),b.length>0&&(n.nodes=b)}return n.object=i,n;function r(o){let a=[];for(let l in o){let c=o[l];delete c.metadata,a.push(c)}return a}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Te.DEFAULT_UP=new A(0,1,0);Te.DEFAULT_MATRIX_AUTO_UPDATE=!0;Te.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var yn=class extends Te{constructor(){super(),this.isGroup=!0,this.type="Group"}};var Dr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pe={h:0,s:0,l:0},jn={h:0,s:0,l:0};function ns(_,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?_+(t-_)*6*e:e<1/2?t:e<2/3?_+(t-_)*6*(2/3-e):_}var ut=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Zt){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ne.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=ne.workingColorSpace){return this.r=t,this.g=e,this.b=n,ne.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=ne.workingColorSpace){if(t=na(t,1),e=ft(e,0,1),n=ft(n,0,1),e===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+e):n+e-n*e,r=2*n-s;this.r=ns(r,s,t+1/3),this.g=ns(r,s,t),this.b=ns(r,s,t-1/3)}return ne.colorSpaceToWorking(this,i),this}setStyle(t,e=Zt){function n(s){s!==void 0&&parseFloat(s)<1&&Ut("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s,r=i[1],o=i[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Ut("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){let s=i[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);Ut("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Zt){let n=Dr[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Ut("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ee(t.r),this.g=Ee(t.g),this.b=Ee(t.b),this}copyLinearToSRGB(t){return this.r=_n(t.r),this.g=_n(t.g),this.b=_n(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Zt){return ne.workingToColorSpace(Ht.copy(this),t),Math.round(ft(Ht.r*255,0,255))*65536+Math.round(ft(Ht.g*255,0,255))*256+Math.round(ft(Ht.b*255,0,255))}getHexString(t=Zt){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ne.workingColorSpace){ne.workingToColorSpace(Ht.copy(this),e);let n=Ht.r,i=Ht.g,s=Ht.b,r=Math.max(n,i,s),o=Math.min(n,i,s),a,l,c=(o+r)/2;if(o===r)a=0,l=0;else{let d=r-o;switch(l=c<=.5?d/(r+o):d/(2-r-o),r){case n:a=(i-s)/d+(i<s?6:0);break;case i:a=(s-n)/d+2;break;case s:a=(n-i)/d+4;break}a/=6}return t.h=a,t.s=l,t.l=c,t}getRGB(t,e=ne.workingColorSpace){return ne.workingToColorSpace(Ht.copy(this),e),t.r=Ht.r,t.g=Ht.g,t.b=Ht.b,t}getStyle(t=Zt){ne.workingToColorSpace(Ht.copy(this),t);let e=Ht.r,n=Ht.g,i=Ht.b;return t!==Zt?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Pe),this.setHSL(Pe.h+t,Pe.s+e,Pe.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Pe),t.getHSL(jn);let n=$i(Pe.h,jn.h,e),i=$i(Pe.s,jn.s,e),s=$i(Pe.l,jn.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ht=new ut;ut.NAMES=Dr;var ae=new A,ve=new A,is=new A,Me=new A,cn=new A,hn=new A,hr=new A,ss=new A,rs=new A,as=new A,os=new xn,ls=new xn,cs=new xn,Ne=class _{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),ae.subVectors(t,e),i.cross(ae);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){ae.subVectors(i,e),ve.subVectors(n,e),is.subVectors(t,e);let r=ae.dot(ae),o=ae.dot(ve),a=ae.dot(is),l=ve.dot(ve),c=ve.dot(is),d=r*l-o*o;if(d===0)return s.set(0,0,0),null;let m=1/d,y=(l*a-o*c)*m,b=(r*c-o*a)*m;return s.set(1-y-b,b,y)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Me)===null?!1:Me.x>=0&&Me.y>=0&&Me.x+Me.y<=1}static getInterpolation(t,e,n,i,s,r,o,a){return this.getBarycoord(t,e,n,i,Me)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(s,Me.x),a.addScaledVector(r,Me.y),a.addScaledVector(o,Me.z),a)}static getInterpolatedAttribute(t,e,n,i,s,r){return os.setScalar(0),ls.setScalar(0),cs.setScalar(0),os.fromBufferAttribute(t,e),ls.fromBufferAttribute(t,n),cs.fromBufferAttribute(t,i),r.setScalar(0),r.addScaledVector(os,s.x),r.addScaledVector(ls,s.y),r.addScaledVector(cs,s.z),r}static isFrontFacing(t,e,n,i){return ae.subVectors(n,e),ve.subVectors(t,e),ae.cross(ve).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ae.subVectors(this.c,this.b),ve.subVectors(this.a,this.b),ae.cross(ve).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return _.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return _.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return _.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return _.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return _.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,i=this.b,s=this.c,r,o;cn.subVectors(i,n),hn.subVectors(s,n),ss.subVectors(t,n);let a=cn.dot(ss),l=hn.dot(ss);if(a<=0&&l<=0)return e.copy(n);rs.subVectors(t,i);let c=cn.dot(rs),d=hn.dot(rs);if(c>=0&&d<=c)return e.copy(i);let m=a*d-c*l;if(m<=0&&a>=0&&c<=0)return r=a/(a-c),e.copy(n).addScaledVector(cn,r);as.subVectors(t,s);let y=cn.dot(as),b=hn.dot(as);if(b>=0&&y<=b)return e.copy(s);let I=y*l-a*b;if(I<=0&&l>=0&&b<=0)return o=l/(l-b),e.copy(n).addScaledVector(hn,o);let N=c*b-y*d;if(N<=0&&d-c>=0&&y-b>=0)return hr.subVectors(s,i),o=(d-c)/(d-c+(y-b)),e.copy(i).addScaledVector(hr,o);let B=1/(N+I+m);return r=I*B,o=m*B,e.copy(n).addScaledVector(cn,r).addScaledVector(hn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Fe=class{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(oe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(oe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=oe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=s.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,oe):oe.fromBufferAttribute(s,r),oe.applyMatrix4(t.matrixWorld),this.expandByPoint(oe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ti.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ti.copy(n.boundingBox)),ti.applyMatrix4(t.matrixWorld),this.union(ti)}let i=t.children;for(let s=0,r=i.length;s<r;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,oe),oe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Cn),ei.subVectors(this.max,Cn),un.subVectors(t.a,Cn),fn.subVectors(t.b,Cn),dn.subVectors(t.c,Cn),Le.subVectors(fn,un),De.subVectors(dn,fn),We.subVectors(un,dn);let e=[0,-Le.z,Le.y,0,-De.z,De.y,0,-We.z,We.y,Le.z,0,-Le.x,De.z,0,-De.x,We.z,0,-We.x,-Le.y,Le.x,0,-De.y,De.x,0,-We.y,We.x,0];return!hs(e,un,fn,dn,ei)||(e=[1,0,0,0,1,0,0,0,1],!hs(e,un,fn,dn,ei))?!1:(ni.crossVectors(Le,De),e=[ni.x,ni.y,ni.z],hs(e,un,fn,dn,ei))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,oe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(oe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Se[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Se[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Se[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Se[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Se[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Se[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Se[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Se[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Se),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Se=[new A,new A,new A,new A,new A,new A,new A,new A],oe=new A,ti=new Fe,un=new A,fn=new A,dn=new A,Le=new A,De=new A,We=new A,Cn=new A,ei=new A,ni=new A,Xe=new A;function hs(_,t,e,n,i){for(let s=0,r=_.length-3;s<=r;s+=3){Xe.fromArray(_,s);let o=i.x*Math.abs(Xe.x)+i.y*Math.abs(Xe.y)+i.z*Math.abs(Xe.z),a=t.dot(Xe),l=e.dot(Xe),c=n.dot(Xe);if(Math.max(-Math.max(a,l,c),Math.min(a,l,c))>o)return!1}return!0}var Nt=new A,ii=new wt,fa=0,Ot=class extends Ue{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:fa++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Pr,this.updateRanges=[],this.gpuType=Rr,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ii.fromBufferAttribute(this,e),ii.applyMatrix3(t),this.setXY(e,ii.x,ii.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.applyMatrix3(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.applyMatrix4(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.applyNormalMatrix(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Nt.fromBufferAttribute(this,e),Nt.transformDirection(t),this.setXYZ(e,Nt.x,Nt.y,Nt.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=An(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Yt(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=An(e,this.array)),e}setX(t,e){return this.normalized&&(e=Yt(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=An(e,this.array)),e}setY(t,e){return this.normalized&&(e=Yt(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=An(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Yt(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=An(e,this.array)),e}setW(t,e){return this.normalized&&(e=Yt(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Yt(e,this.array),n=Yt(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Yt(e,this.array),n=Yt(n,this.array),i=Yt(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=Yt(e,this.array),n=Yt(n,this.array),i=Yt(i,this.array),s=Yt(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Si=class extends Ot{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var bi=class extends Ot{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Wt=class extends Ot{constructor(t,e,n){super(new Float32Array(t),e,n)}},da=new Fe,In=new A,us=new A,Fn=class{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):da.setFromPoints(t).getCenter(n);let i=0;for(let s=0,r=t.length;s<r;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;In.subVectors(t,this.center);let e=In.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(In,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(us.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(In.copy(t.center).add(us)),this.expandByPoint(In.copy(t.center).sub(us))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},pa=0,ee=new Gt,fs=new Te,pn=new A,Kt=new Fe,Pn=new Fe,Bt=new A,le=class _ extends Ue{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:pa++}),this.uuid=Wn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Qr(t)?bi:Si)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new at().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return ee.makeRotationFromQuaternion(t),this.applyMatrix4(ee),this}rotateX(t){return ee.makeRotationX(t),this.applyMatrix4(ee),this}rotateY(t){return ee.makeRotationY(t),this.applyMatrix4(ee),this}rotateZ(t){return ee.makeRotationZ(t),this.applyMatrix4(ee),this}translate(t,e,n){return ee.makeTranslation(t,e,n),this.applyMatrix4(ee),this}scale(t,e,n){return ee.makeScale(t,e,n),this.applyMatrix4(ee),this}lookAt(t){return fs.lookAt(t),fs.updateMatrix(),this.applyMatrix4(fs.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(pn).negate(),this.translate(pn.x,pn.y,pn.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let i=0,s=t.length;i<s;i++){let r=t[i];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Wt(n,3))}else{let n=Math.min(t.length,e.count);for(let i=0;i<n;i++){let s=t[i];e.setXYZ(i,s.x,s.y,s.z||0)}t.length>e.count&&Ut("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fe);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ct("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){let s=e[n];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(Bt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Bt),Bt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Bt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ct('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ct("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){let n=this.boundingSphere.center;if(Kt.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){let o=e[s];Pn.setFromBufferAttribute(o),this.morphTargetsRelative?(Bt.addVectors(Kt.min,Pn.min),Kt.expandByPoint(Bt),Bt.addVectors(Kt.max,Pn.max),Kt.expandByPoint(Bt)):(Kt.expandByPoint(Pn.min),Kt.expandByPoint(Pn.max))}Kt.getCenter(n);let i=0;for(let s=0,r=t.count;s<r;s++)Bt.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Bt));if(e)for(let s=0,r=e.length;s<r;s++){let o=e[s],a=this.morphTargetsRelative;for(let l=0,c=o.count;l<c;l++)Bt.fromBufferAttribute(o,l),a&&(pn.fromBufferAttribute(t,l),Bt.add(pn)),i=Math.max(i,n.distanceToSquared(Bt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Ct('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Ct("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,i=e.normal,s=e.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==n.count)&&(r=new Ot(new Float32Array(4*n.count),4),this.setAttribute("tangent",r));let o=[],a=[];for(let X=0;X<n.count;X++)o[X]=new A,a[X]=new A;let l=new A,c=new A,d=new A,m=new wt,y=new wt,b=new wt,I=new A,N=new A;function B(X,tt,et){l.fromBufferAttribute(n,X),c.fromBufferAttribute(n,tt),d.fromBufferAttribute(n,et),m.fromBufferAttribute(s,X),y.fromBufferAttribute(s,tt),b.fromBufferAttribute(s,et),c.sub(l),d.sub(l),y.sub(m),b.sub(m);let rt=1/(y.x*b.y-b.x*y.y);isFinite(rt)&&(I.copy(c).multiplyScalar(b.y).addScaledVector(d,-y.y).multiplyScalar(rt),N.copy(d).multiplyScalar(y.x).addScaledVector(c,-b.x).multiplyScalar(rt),o[X].add(I),o[tt].add(I),o[et].add(I),a[X].add(N),a[tt].add(N),a[et].add(N))}let D=this.groups;D.length===0&&(D=[{start:0,count:t.count}]);for(let X=0,tt=D.length;X<tt;++X){let et=D[X],rt=et.start,ot=et.count;for(let lt=rt,vt=rt+ot;lt<vt;lt+=3)B(t.getX(lt+0),t.getX(lt+1),t.getX(lt+2))}let z=new A,U=new A,q=new A,J=new A;function $(X){q.fromBufferAttribute(i,X),J.copy(q);let tt=o[X];z.copy(tt),z.sub(q.multiplyScalar(q.dot(tt))).normalize(),U.crossVectors(J,tt);let rt=U.dot(a[X])<0?-1:1;r.setXYZW(X,z.x,z.y,z.z,rt)}for(let X=0,tt=D.length;X<tt;++X){let et=D[X],rt=et.start,ot=et.count;for(let lt=rt,vt=rt+ot;lt<vt;lt+=3)$(t.getX(lt+0)),$(t.getX(lt+1)),$(t.getX(lt+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Ot(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let m=0,y=n.count;m<y;m++)n.setXYZ(m,0,0,0);let i=new A,s=new A,r=new A,o=new A,a=new A,l=new A,c=new A,d=new A;if(t)for(let m=0,y=t.count;m<y;m+=3){let b=t.getX(m+0),I=t.getX(m+1),N=t.getX(m+2);i.fromBufferAttribute(e,b),s.fromBufferAttribute(e,I),r.fromBufferAttribute(e,N),c.subVectors(r,s),d.subVectors(i,s),c.cross(d),o.fromBufferAttribute(n,b),a.fromBufferAttribute(n,I),l.fromBufferAttribute(n,N),o.add(c),a.add(c),l.add(c),n.setXYZ(b,o.x,o.y,o.z),n.setXYZ(I,a.x,a.y,a.z),n.setXYZ(N,l.x,l.y,l.z)}else for(let m=0,y=e.count;m<y;m+=3)i.fromBufferAttribute(e,m+0),s.fromBufferAttribute(e,m+1),r.fromBufferAttribute(e,m+2),c.subVectors(r,s),d.subVectors(i,s),c.cross(d),n.setXYZ(m+0,c.x,c.y,c.z),n.setXYZ(m+1,c.x,c.y,c.z),n.setXYZ(m+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Bt.fromBufferAttribute(t,e),Bt.normalize(),t.setXYZ(e,Bt.x,Bt.y,Bt.z)}toNonIndexed(){function t(o,a){let l=o.array,c=o.itemSize,d=o.normalized,m=new l.constructor(a.length*c),y=0,b=0;for(let I=0,N=a.length;I<N;I++){o.isInterleavedBufferAttribute?y=a[I]*o.data.stride+o.offset:y=a[I]*c;for(let B=0;B<c;B++)m[b++]=l[y++]}return new Ot(m,c,d)}if(this.index===null)return Ut("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new _,n=this.index.array,i=this.attributes;for(let o in i){let a=i[o],l=t(a,n);e.setAttribute(o,l)}let s=this.morphAttributes;for(let o in s){let a=[],l=s[o];for(let c=0,d=l.length;c<d;c++){let m=l[c],y=t(m,n);a.push(y)}e.morphAttributes[o]=a}e.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,a=r.length;o<a;o++){let l=r[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let l in a)a[l]!==void 0&&(t[l]=a[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let a in n){let l=n[a];t.data.attributes[a]=l.toJSON(t.data)}let i={},s=!1;for(let a in this.morphAttributes){let l=this.morphAttributes[a],c=[];for(let d=0,m=l.length;d<m;d++){let y=l[d];c.push(y.toJSON(t.data))}c.length>0&&(i[a]=c,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let i=t.attributes;for(let l in i){let c=i[l];this.setAttribute(l,c.clone(e))}let s=t.morphAttributes;for(let l in s){let c=[],d=s[l];for(let m=0,y=d.length;m<y;m++)c.push(d[m].clone(e));this.morphAttributes[l]=c}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let l=0,c=r.length;l<c;l++){let d=r[l];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let a=t.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var ds=new A,ma=new A,ga=new at,Ei=class{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let i=ds.subVectors(n,e).cross(ma.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let i=t.delta(ds),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(r<0||r>1)?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||ga.getNormalMatrix(t),i=this.coplanarPoint(ds).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},_a=0,On=class extends Ue{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:_a++}),this.uuid=Wn(),this.name="",this.type="Material",this.blending=yr,this.side=Fs,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Mr,this.blendDst=Sr,this.blendEquation=vr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ut(0,0,0),this.blendAlpha=0,this.depthFunc=gi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ir,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=mi,this.stencilZFail=mi,this.stencilZPass=mi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Ut(`Material: parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Ut(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){let r=[];for(let o in s){let a=s[o];delete a.metadata,r.push(a)}return r}if(e){let s=i(t.textures),r=i(t.images);s.length>0&&(n.textures=s),r.length>0&&(n.images=r)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new ut().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Ei().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new wt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new wt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var be=new A,ps=new A,si=new A,ri=new A,wi=class{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,be)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=be.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(be.copy(this.origin).addScaledVector(this.direction,e),be.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){ps.copy(t).add(e).multiplyScalar(.5),si.copy(e).sub(t).normalize(),ri.copy(this.origin).sub(ps);let s=t.distanceTo(e)*.5,r=-this.direction.dot(si),o=ri.dot(this.direction),a=-ri.dot(si),l=ri.lengthSq(),c=Math.abs(1-r*r),d,m,y,b;if(c>0)if(d=r*a-o,m=r*o-a,b=s*c,d>=0)if(m>=-b)if(m<=b){let I=1/c;d*=I,m*=I,y=d*(d+r*m+2*o)+m*(r*d+m+2*a)+l}else m=s,d=Math.max(0,-(r*m+o)),y=-d*d+m*(m+2*a)+l;else m=-s,d=Math.max(0,-(r*m+o)),y=-d*d+m*(m+2*a)+l;else m<=-b?(d=Math.max(0,-(-r*s+o)),m=d>0?-s:Math.min(Math.max(-s,-a),s),y=-d*d+m*(m+2*a)+l):m<=b?(d=0,m=Math.min(Math.max(-s,-a),s),y=m*(m+2*a)+l):(d=Math.max(0,-(r*s+o)),m=d>0?s:Math.min(Math.max(-s,-a),s),y=-d*d+m*(m+2*a)+l);else m=r>0?-s:s,d=Math.max(0,-(r*m+o)),y=-d*d+m*(m+2*a)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),i&&i.copy(ps).addScaledVector(si,m),y}intersectSphere(t,e){if(t.radius<0)return null;be.subVectors(t.center,this.origin);let n=be.dot(this.direction),i=be.dot(be)-n*n,s=t.radius*t.radius;if(i>s)return null;let r=Math.sqrt(s-i),o=n-r,a=n+r;return a<0?null:o<0?this.at(a,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,r,o,a,l=1/this.direction.x,c=1/this.direction.y,d=1/this.direction.z,m=this.origin;return l>=0?(n=(t.min.x-m.x)*l,i=(t.max.x-m.x)*l):(n=(t.max.x-m.x)*l,i=(t.min.x-m.x)*l),c>=0?(s=(t.min.y-m.y)*c,r=(t.max.y-m.y)*c):(s=(t.max.y-m.y)*c,r=(t.min.y-m.y)*c),n>r||s>i||((s>n||isNaN(n))&&(n=s),(r<i||isNaN(i))&&(i=r),d>=0?(o=(t.min.z-m.z)*d,a=(t.max.z-m.z)*d):(o=(t.max.z-m.z)*d,a=(t.min.z-m.z)*d),n>a||o>i)||((o>n||n!==n)&&(n=o),(a<i||i!==i)&&(i=a),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,be)!==null}intersectTriangle(t,e,n,i,s){let r=this.origin,o=this.direction,a=o.x,l=o.y,c=o.z,d=t.x-r.x,m=t.y-r.y,y=t.z-r.z,b=e.x-r.x,I=e.y-r.y,N=e.z-r.z,B=n.x-r.x,D=n.y-r.y,z=n.z-r.z,U=Math.abs(a),q=Math.abs(l),J=Math.abs(c),$,X,tt,et,rt,ot,lt,vt,ct,Dt,Mt,It;if(U>=q&&U>=J?(tt=a,ot=d,ct=b,It=B,a>=0?($=l,X=c,et=m,rt=y,lt=I,vt=N,Dt=D,Mt=z):($=c,X=l,et=y,rt=m,lt=N,vt=I,Dt=z,Mt=D)):q>=J?(tt=l,ot=m,ct=I,It=D,l>=0?($=c,X=a,et=y,rt=d,lt=N,vt=b,Dt=z,Mt=B):($=a,X=c,et=d,rt=y,lt=b,vt=N,Dt=B,Mt=z)):(tt=c,ot=y,ct=N,It=z,c>=0?($=a,X=l,et=d,rt=m,lt=b,vt=I,Dt=B,Mt=D):($=l,X=a,et=m,rt=d,lt=I,vt=b,Dt=D,Mt=B)),tt===0)return null;let xt=$/tt,At=X/tt,St=1/tt,kt=et-xt*ot,Jt=rt-At*ot,ie=lt-xt*ct,de=vt-At*ct,Je=Dt-xt*It,$e=Mt-At*It,ce=Je*de-$e*ie,pe=kt*$e-Jt*Je,me=ie*Jt-de*kt;if(i){if(ce<0||pe<0||me<0)return null}else if((ce<0||pe<0||me<0)&&(ce>0||pe>0||me>0))return null;let ke=ce+pe+me;if(ke===0)return null;let Re=St*(ce*ot+pe*ct+me*It);return(ke>0?Re<0:Re>0)?null:this.at(Re/ke,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ti=class extends On{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ze,this.combine=Os,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},ur=new Gt,qe=new wi,ai=new Fn,fr=new A,oi=new A,li=new A,ci=new A,ms=new A,hi=new A,dr=new A,ui=new A,Bn=class extends Te{constructor(t=new le,e=new Ti){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){let o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){let n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(i,t);let o=this.morphTargetInfluences;if(s&&o){hi.set(0,0,0);for(let a=0,l=s.length;a<l;a++){let c=o[a],d=s[a];c!==0&&(ms.fromBufferAttribute(d,t),r?hi.addScaledVector(ms,c):hi.addScaledVector(ms.sub(e),c))}e.add(hi)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ai.copy(n.boundingSphere),ai.applyMatrix4(s),qe.copy(t.ray).recast(t.near),!(ai.containsPoint(qe.origin)===!1&&(qe.intersectSphere(ai,fr)===null||qe.origin.distanceToSquared(fr)>(t.far-t.near)**2))&&(ur.copy(s).invert(),qe.copy(t.ray).applyMatrix4(ur),!(n.boundingBox!==null&&qe.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,qe)))}_computeIntersections(t,e,n){let i,s=this.geometry,r=this.material,o=s.index,a=s.attributes.position,l=s.attributes.uv,c=s.attributes.uv1,d=s.attributes.normal,m=s.groups,y=s.drawRange;if(o!==null)if(Array.isArray(r))for(let b=0,I=m.length;b<I;b++){let N=m[b],B=r[N.materialIndex],D=Math.max(N.start,y.start),z=Math.min(o.count,Math.min(N.start+N.count,y.start+y.count));for(let U=D,q=z;U<q;U+=3){let J=o.getX(U),$=o.getX(U+1),X=o.getX(U+2);i=fi(this,B,t,n,l,c,d,J,$,X),i&&(i.faceIndex=Math.floor(U/3),i.face.materialIndex=N.materialIndex,e.push(i))}}else{let b=Math.max(0,y.start),I=Math.min(o.count,y.start+y.count);for(let N=b,B=I;N<B;N+=3){let D=o.getX(N),z=o.getX(N+1),U=o.getX(N+2);i=fi(this,r,t,n,l,c,d,D,z,U),i&&(i.faceIndex=Math.floor(N/3),e.push(i))}}else if(a!==void 0)if(Array.isArray(r))for(let b=0,I=m.length;b<I;b++){let N=m[b],B=r[N.materialIndex],D=Math.max(N.start,y.start),z=Math.min(a.count,Math.min(N.start+N.count,y.start+y.count));for(let U=D,q=z;U<q;U+=3){let J=U,$=U+1,X=U+2;i=fi(this,B,t,n,l,c,d,J,$,X),i&&(i.faceIndex=Math.floor(U/3),i.face.materialIndex=N.materialIndex,e.push(i))}}else{let b=Math.max(0,y.start),I=Math.min(a.count,y.start+y.count);for(let N=b,B=I;N<B;N+=3){let D=N,z=N+1,U=N+2;i=fi(this,r,t,n,l,c,d,D,z,U),i&&(i.faceIndex=Math.floor(N/3),e.push(i))}}}};function xa(_,t,e,n,i,s,r,o){let a;if(t.side===xr?a=n.intersectTriangle(r,s,i,!0,o):a=n.intersectTriangle(i,s,r,t.side===Fs,o),a===null)return null;ui.copy(o),ui.applyMatrix4(_.matrixWorld);let l=e.ray.origin.distanceTo(ui);return l<e.near||l>e.far?null:{distance:l,point:ui.clone(),object:_}}function fi(_,t,e,n,i,s,r,o,a,l){_.getVertexPosition(o,oi),_.getVertexPosition(a,li),_.getVertexPosition(l,ci);let c=xa(_,t,e,n,oi,li,ci,dr);if(c){let d=new A;Ne.getBarycoord(dr,oi,li,ci,d),i&&(c.uv=Ne.getInterpolatedAttribute(i,o,a,l,d,new wt)),s&&(c.uv1=Ne.getInterpolatedAttribute(s,o,a,l,d,new wt)),r&&(c.normal=Ne.getInterpolatedAttribute(r,o,a,l,d,new A),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let m={a:o,b:a,c:l,normal:new A,materialIndex:0};Ne.getNormal(oi,li,ci,m.normal),c.face=m,c.barycoord=d}return c}var zn=class extends Ye{constructor(t=null,e=1,n=1,i,s,r,o,a,l=ws,c=ws,d,m){super(null,r,o,a,l,c,i,s,d,m),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var kn=class _ extends le{constructor(t=1,e=1,n=1,i=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:r};let o=this;i=Math.floor(i),s=Math.floor(s),r=Math.floor(r);let a=[],l=[],c=[],d=[],m=0,y=0;b("z","y","x",-1,-1,n,e,t,r,s,0),b("z","y","x",1,-1,n,e,-t,r,s,1),b("x","z","y",1,1,t,n,e,i,r,2),b("x","z","y",1,-1,t,n,-e,i,r,3),b("x","y","z",1,-1,t,e,n,i,s,4),b("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(a),this.setAttribute("position",new Wt(l,3)),this.setAttribute("normal",new Wt(c,3)),this.setAttribute("uv",new Wt(d,2));function b(I,N,B,D,z,U,q,J,$,X,tt){let et=U/$,rt=q/X,ot=U/2,lt=q/2,vt=J/2,ct=$+1,Dt=X+1,Mt=0,It=0,xt=new A;for(let At=0;At<Dt;At++){let St=At*rt-lt;for(let kt=0;kt<ct;kt++){let Jt=kt*et-ot;xt[I]=Jt*D,xt[N]=St*z,xt[B]=vt,l.push(xt.x,xt.y,xt.z),xt[I]=0,xt[N]=0,xt[B]=J>0?1:-1,c.push(xt.x,xt.y,xt.z),d.push(kt/$),d.push(1-At/X),Mt+=1}}for(let At=0;At<X;At++)for(let St=0;St<$;St++){let kt=m+St+ct*At,Jt=m+St+ct*(At+1),ie=m+(St+1)+ct*(At+1),de=m+(St+1)+ct*At;a.push(kt,Jt,de),a.push(Jt,ie,de),It+=6}o.addGroup(y,It,tt),y+=It,m+=Mt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new _(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Ai=class _ extends le{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};let s=[],r=[];o(i),l(n),c(),this.setAttribute("position",new Wt(s,3)),this.setAttribute("normal",new Wt(s.slice(),3)),this.setAttribute("uv",new Wt(r,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(D){let z=new A,U=new A,q=new A;for(let J=0;J<e.length;J+=3)y(e[J+0],z),y(e[J+1],U),y(e[J+2],q),a(z,U,q,D)}function a(D,z,U,q){let J=q+1,$=[];for(let X=0;X<=J;X++){$[X]=[];let tt=D.clone().lerp(U,X/J),et=z.clone().lerp(U,X/J),rt=J-X;for(let ot=0;ot<=rt;ot++)ot===0&&X===J?$[X][ot]=tt:$[X][ot]=tt.clone().lerp(et,ot/rt)}for(let X=0;X<J;X++)for(let tt=0;tt<2*(J-X)-1;tt++){let et=Math.floor(tt/2);tt%2===0?(m($[X][et+1]),m($[X+1][et]),m($[X][et])):(m($[X][et+1]),m($[X+1][et+1]),m($[X+1][et]))}}function l(D){let z=new A;for(let U=0;U<s.length;U+=3)z.x=s[U+0],z.y=s[U+1],z.z=s[U+2],z.normalize().multiplyScalar(D),s[U+0]=z.x,s[U+1]=z.y,s[U+2]=z.z}function c(){let D=new A;for(let z=0;z<s.length;z+=3){D.x=s[z+0],D.y=s[z+1],D.z=s[z+2];let U=N(D)/2/Math.PI+.5,q=B(D)/Math.PI+.5;r.push(U,1-q)}b(),d()}function d(){for(let D=0;D<r.length;D+=6){let z=r[D+0],U=r[D+2],q=r[D+4],J=Math.max(z,U,q),$=Math.min(z,U,q);J>.9&&$<.1&&(z<.2&&(r[D+0]+=1),U<.2&&(r[D+2]+=1),q<.2&&(r[D+4]+=1))}}function m(D){s.push(D.x,D.y,D.z)}function y(D,z){let U=D*3;z.x=t[U+0],z.y=t[U+1],z.z=t[U+2]}function b(){let D=new A,z=new A,U=new A,q=new A,J=new wt,$=new wt,X=new wt;for(let tt=0,et=0;tt<s.length;tt+=9,et+=6){D.set(s[tt+0],s[tt+1],s[tt+2]),z.set(s[tt+3],s[tt+4],s[tt+5]),U.set(s[tt+6],s[tt+7],s[tt+8]),J.set(r[et+0],r[et+1]),$.set(r[et+2],r[et+3]),X.set(r[et+4],r[et+5]),q.copy(D).add(z).add(U).divideScalar(3);let rt=N(q);I(J,et+0,D,rt),I($,et+2,z,rt),I(X,et+4,U,rt)}}function I(D,z,U,q){q<0&&D.x===1&&(r[z]=D.x-1),U.x===0&&U.z===0&&(r[z]=q/2/Math.PI+.5)}function N(D){return Math.atan2(D.z,-D.x)}function B(D){return Math.atan2(-D.y,Math.sqrt(D.x*D.x+D.z*D.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new _(t.vertices,t.indices,t.radius,t.detail)}};var Vn=class _ extends Ai{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new _(t.radius,t.detail)}};function Nr(_){let t={};for(let e in _){t[e]={};for(let n in _[e]){let i=_[e][n];if(pr(i))i.isRenderTargetTexture?(Ut("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(pr(i[0])){let s=[];for(let r=0,o=i.length;r<o;r++)s[r]=i[r].clone();t[e][n]=s}else t[e][n]=i.slice();else t[e][n]=i}}return t}function Xt(_){let t={};for(let e=0;e<_.length;e++){let n=Nr(_[e]);for(let i in n)t[i]=n[i]}return t}function pr(_){return _&&(_.isColor||_.isMatrix3||_.isMatrix4||_.isVector2||_.isVector3||_.isVector4||_.isTexture||_.isQuaternion)}var Ri=class extends On{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ut(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Cr,this.normalScale=new wt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ze,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},Hn=class extends Ri{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new wt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ft(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ut(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ut(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ut(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};function mn(_,t){return!_||_.constructor===t?_:typeof t.BYTES_PER_ELEMENT=="number"?new t(_):Array.prototype.slice.call(_)}function gs(_){return _!==void 0&&_.inTangents!==void 0&&_.outTangents!==void 0}var Oe=class{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,i=e[n],s=e[n-1];n:{t:{let r;e:{i:if(!(t<i)){for(let o=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(s=i,i=e[++n],t<i)break t}r=e.length;break e}if(!(t>=s)){let o=e[1];t<o&&(n=2,s=o);for(let a=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=s,s=e[--n-1],t>=s)break t}r=n,n=0;break e}break n}for(;n<r;){let o=n+r>>>1;t<e[o]?r=o:n=o+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let r=0;r!==i;++r)e[r]=n[s+r];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Ci=class extends Oe{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:As,endingEnd:As}}intervalChanged_(t,e,n){let i=this.parameterPositions,s=t-2,r=t+1,o=i[s],a=i[r];if(o===void 0)switch(this.getSettings_().endingStart){case Rs:s=t,o=2*e-n;break;case Cs:s=i.length-2,o=e+i[s]-i[s+1];break;default:s=t,o=n}if(a===void 0)switch(this.getSettings_().endingEnd){case Rs:r=t,a=2*n-e;break;case Cs:r=1,a=n+i[1]-i[0];break;default:r=t-1,a=e}let l=(n-e)*.5,c=this.valueSize;this._weightPrev=l/(e-o),this._weightNext=l/(a-n),this._offsetPrev=s*c,this._offsetNext=r*c}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=t*o,l=a-o,c=this._offsetPrev,d=this._offsetNext,m=this._weightPrev,y=this._weightNext,b=(n-e)/(i-e),I=b*b,N=I*b,B=-m*N+2*m*I-m*b,D=(1+m)*N+(-1.5-2*m)*I+(-.5+m)*b+1,z=(-1-y)*N+(1.5+y)*I+.5*b,U=y*N-y*I;for(let q=0;q!==o;++q)s[q]=B*r[c+q]+D*r[l+q]+z*r[a+q]+U*r[d+q];return s}},Ii=class extends Oe{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=t*o,l=a-o,c=(n-e)/(i-e),d=1-c;for(let m=0;m!==o;++m)s[m]=r[l+m]*d+r[a+m]*c;return s}},Pi=class extends Oe{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}},Li=class extends Oe{interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=t*o,l=a-o,c=this.inTangents,d=this.outTangents;if(!c||!d){let b=(n-e)/(i-e),I=1-b;for(let N=0;N!==o;++N)s[N]=r[l+N]*I+r[a+N]*b;return s}let m=o*2,y=t-1;for(let b=0;b!==o;++b){let I=r[l+b],N=r[a+b],B=y*m+b*2,D=d[B],z=d[B+1],U=t*m+b*2,q=c[U],J=c[U+1],$=va(n,e,D,q,i);s[b]=Ur($,I,z,J,N)}return s}};function Ur(_,t,e,n,i){let s=1-_;return s*s*s*t+3*s*s*_*e+3*s*_*_*n+_*_*_*i}function ya(_,t,e,n,i){let s=1-_;return 3*s*s*(e-t)+6*s*_*(n-e)+3*_*_*(i-n)}function va(_,t,e,n,i){let s=(_-t)/(i-t);for(let r=0;r<8;r++){let o=Ur(s,t,e,n,i)-_;if(Math.abs(o)<1e-10)break;let a=ya(s,t,e,n,i);if(Math.abs(a)<1e-10)break;s=Math.max(0,Math.min(1,s-o/a))}return s}var Qt=class{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=mn(e,this.TimeBufferType),this.values=mn(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:mn(t.times,Array),values:mn(t.values,Array)};let i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i),gs(t.settings)&&(n.settings={inTangents:mn(t.settings.inTangents,Array),outTangents:mn(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Pi(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Ii(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ci(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Li(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Un:e=this.InterpolantFactoryMethodDiscrete;break;case _i:e=this.InterpolantFactoryMethodLinear;break;case di:e=this.InterpolantFactoryMethodSmooth;break;case Ts:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ut("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Un;case this.InterpolantFactoryMethodLinear:return _i;case this.InterpolantFactoryMethodSmooth:return di;case this.InterpolantFactoryMethodBezier:return Ts}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t;gs(this.settings)&&(mr(this.settings.inTangents,t),mr(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,i=n.length,s=0,r=i-1;for(;s!==i&&n[s]<t;)++s;for(;r!==-1&&n[r]>e;)--r;if(++r,s!==0||r!==i){s>=r&&(r=Math.max(r,1),s=r-1);let o=this.getValueSize();this.times=n.slice(s,r),this.values=this.values.slice(s*o,r*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Ct("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,i=this.values,s=n.length;s===0&&(Ct("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==s;o++){let a=n[o];if(typeof a=="number"&&isNaN(a)){Ct("KeyframeTrack: Time is not a valid number.",this,o,a),t=!1;break}if(r!==null&&r>a){Ct("KeyframeTrack: Out of order keys.",this,o,a,r),t=!1;break}r=a}if(i!==void 0&&jr(i))for(let o=0,a=i.length;o!==a;++o){let l=i[o];if(isNaN(l)){Ct("KeyframeTrack: Value is not a valid number.",this,o,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===di,s=t.length-1,r=1;for(let o=1;o<s;++o){let a=!1,l=t[o],c=t[o+1];if(l!==c&&(o!==1||l!==t[0]))if(i)a=!0;else{let d=o*n,m=d-n,y=d+n;for(let b=0;b!==n;++b){let I=e[d+b];if(I!==e[m+b]||I!==e[y+b]){a=!0;break}}}if(a){if(o!==r){t[r]=t[o];let d=o*n,m=r*n;for(let y=0;y!==n;++y)e[m+y]=e[d+y]}++r}}if(s>0){t[r]=t[s];for(let o=s*n,a=r*n,l=0;l!==n;++l)e[a+l]=e[o+l];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=e.slice(0,r*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,gs(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function mr(_,t){for(let e=0,n=_.length;e!==n;e+=2)_[e]*=t}Qt.prototype.ValueTypeName="";Qt.prototype.TimeBufferType=Float32Array;Qt.prototype.ValueBufferType=Float32Array;Qt.prototype.DefaultInterpolation=_i;var Be=class extends Qt{constructor(t,e,n){super(t,e,n)}};Be.prototype.ValueTypeName="bool";Be.prototype.ValueBufferType=Array;Be.prototype.DefaultInterpolation=Un;Be.prototype.InterpolantFactoryMethodLinear=void 0;Be.prototype.InterpolantFactoryMethodSmooth=void 0;var Di=class extends Qt{constructor(t,e,n,i){super(t,e,n,i)}};Di.prototype.ValueTypeName="color";var Ni=class extends Qt{constructor(t,e,n,i){super(t,e,n,i)}};Ni.prototype.ValueTypeName="number";var Ui=class extends Oe{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=(n-e)/(i-e),l=t*o;for(let c=l+o;l!==c;l+=4)we.slerpFlat(s,0,r,l-o,r,l,a);return s}},Gn=class extends Qt{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new Ui(this.times,this.values,this.getValueSize(),t)}};Gn.prototype.ValueTypeName="quaternion";Gn.prototype.InterpolantFactoryMethodSmooth=void 0;var ze=class extends Qt{constructor(t,e,n){super(t,e,n)}};ze.prototype.ValueTypeName="string";ze.prototype.ValueBufferType=Array;ze.prototype.DefaultInterpolation=Un;ze.prototype.InterpolantFactoryMethodLinear=void 0;ze.prototype.InterpolantFactoryMethodSmooth=void 0;var Fi=class extends Qt{constructor(t,e,n,i){super(t,e,n,i)}};Fi.prototype.ValueTypeName="vector";var Oi=class{constructor(t,e,n){let i=this,s=!1,r=0,o=0,a,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(c){o++,s===!1&&i.onStart!==void 0&&i.onStart(c,r,o),s=!0},this.itemEnd=function(c){r++,i.onProgress!==void 0&&i.onProgress(c,r,o),r===o&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(c){i.onError!==void 0&&i.onError(c)},this.resolveURL=function(c){return c=c.normalize("NFC"),a?a(c):c},this.setURLModifier=function(c){return a=c,this},this.addHandler=function(c,d){return l.push(c,d),this},this.removeHandler=function(c){let d=l.indexOf(c);return d!==-1&&l.splice(d,2),this},this.getHandler=function(c){for(let d=0,m=l.length;d<m;d+=2){let y=l[d],b=l[d+1];if(y.global&&(y.lastIndex=0),y.test(c))return b}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Fr=new Oi,Bi=class{constructor(t){this.manager=t!==void 0?t:Fr,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Bi.DEFAULT_MATERIAL_NAME="__DEFAULT";var Zs="\\[\\]\\.:\\/",Ma=new RegExp("["+Zs+"]","g"),Js="[^"+Zs+"]",Sa="[^"+Zs.replace("\\.","")+"]",ba=/((?:WC+[\/:])*)/.source.replace("WC",Js),Ea=/(WCOD+)?/.source.replace("WCOD",Sa),wa=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Js),Ta=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Js),Aa=new RegExp("^"+ba+Ea+wa+Ta+"$"),Ra=["material","materials","bones","map"],Ns=class{constructor(t,e,n){let i=n||Tt.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Tt=class _{constructor(t,e,n){this.path=e,this.parsedPath=n||_.parseTrackName(e),this.node=_.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new _.Composite(t,e,n):new _(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Ma,"")}static parseTrackName(t){let e=Aa.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);Ra.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(s){for(let r=0;r<s.length;r++){let o=s[r];if(o.name===e||o.uuid===e)return o;let a=n(o.children);if(a)return a}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,i=e.propertyName,s=e.propertyIndex;if(t||(t=_.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Ut("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){Ct("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Ct("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Ct("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let c=0;c<t.length;c++)if(t[c].name===l){l=c;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Ct("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Ct("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Ct("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){Ct("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let r=t[i];if(r===void 0){let l=e.nodeName;Ct("PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){Ct("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Ct("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}a=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=s}else r.fromArray!==void 0&&r.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(a=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Tt.Composite=Ns;Tt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Tt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Tt.prototype.GetterByBindingType=[Tt.prototype._getValue_direct,Tt.prototype._getValue_array,Tt.prototype._getValue_arrayElement,Tt.prototype._getValue_toArray];Tt.prototype.SetterByBindingTypeAndVersioning=[[Tt.prototype._setValue_direct,Tt.prototype._setValue_direct_setNeedsUpdate,Tt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Tt.prototype._setValue_array,Tt.prototype._setValue_array_setNeedsUpdate,Tt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Tt.prototype._setValue_arrayElement,Tt.prototype._setValue_arrayElement_setNeedsUpdate,Tt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Tt.prototype._setValue_fromArray,Tt.prototype._setValue_fromArray_setNeedsUpdate,Tt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ic=new Float32Array(1);var Us=class _{static{_.prototype.isMatrix2=!0}constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){let s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=i,this}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ut("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");var Ua=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Fa=`#ifdef USE_ALPHAHASH
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
#endif`,Oa=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ba=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,za=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ka=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Va=`#ifdef USE_AOMAP
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
#endif`,Ha=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ga=`#ifdef USE_BATCHING
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
#endif`,Wa=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Xa=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,qa=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ya=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Za=`#ifdef USE_IRIDESCENCE
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
#endif`,Ja=`#ifdef USE_BUMPMAP
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
#endif`,$a=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Ka=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Qa=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ja=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,to=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,eo=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,no=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,io=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,so=`#define PI 3.141592653589793
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
} // validated`,ro=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,ao=`vec3 transformedNormal = objectNormal;
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
#endif`,oo=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,lo=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,co=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ho=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,uo="gl_FragColor = linearToOutputTexel( gl_FragColor );",fo=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,po=`#ifdef USE_ENVMAP
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
#endif`,mo=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,go=`#ifdef USE_ENVMAP
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
#endif`,_o=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,xo=`#ifdef USE_ENVMAP
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
#endif`,yo=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,vo=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Mo=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,So=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,bo=`#ifdef USE_GRADIENTMAP
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
#endif`,wo=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,To=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ao=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Ro=`#ifdef USE_ENVMAP
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
#endif`,Co=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Io=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Po=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Lo=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Do=`PhysicalMaterial material;
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
#endif`,No=`uniform sampler2D dfgLUT;
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
}`,Uo=`
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
#endif`,Fo=`#if defined( RE_IndirectDiffuse )
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
#endif`,Oo=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Bo=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,zo=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ko=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Vo=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ho=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Go=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Wo=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Xo=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,qo=`#if defined( USE_POINTS_UV )
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
#endif`,Yo=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zo=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Jo=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$o=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ko=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Qo=`#ifdef USE_MORPHTARGETS
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
#endif`,jo=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,tl=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,el=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,nl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,il=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,sl=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,rl=`#ifdef USE_NORMALMAP
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
#endif`,al=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,ol=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ll=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,cl=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,hl=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ul=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,fl=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,dl=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,pl=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,ml=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,gl=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,_l=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,xl=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,yl=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,vl=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Ml=`float getShadowMask() {
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
}`,Sl=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,bl=`#ifdef USE_SKINNING
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
#endif`,wl=`#ifdef USE_SKINNING
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
#endif`,Tl=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Al=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Rl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Cl=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Il=`#ifdef USE_TRANSMISSION
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
#endif`,Pl=`#ifdef USE_TRANSMISSION
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
#endif`,Ll=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Dl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Nl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Ul=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Fl=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ol=`uniform sampler2D t2D;
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
}`,Bl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zl=`#ifdef ENVMAP_TYPE_CUBE
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
}`,kl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Vl=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hl=`#include <common>
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
}`,Gl=`#if DEPTH_PACKING == 3200
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
}`,Wl=`#define DISTANCE
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
}`,Xl=`#define DISTANCE
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
}`,ql=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Yl=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zl=`uniform float scale;
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
}`,Jl=`uniform vec3 diffuse;
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
}`,$l=`#include <common>
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
}`,Kl=`uniform vec3 diffuse;
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
}`,Ql=`#define LAMBERT
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
}`,jl=`#define LAMBERT
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
}`,tc=`#define MATCAP
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
}`,ec=`#define MATCAP
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
}`,nc=`#define NORMAL
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
}`,ic=`#define NORMAL
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
}`,sc=`#define PHONG
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
}`,rc=`#define PHONG
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
}`,ac=`#define STANDARD
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
}`,oc=`#define STANDARD
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
}`,lc=`#define TOON
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
}`,cc=`#define TOON
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
}`,hc=`uniform float size;
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
}`,uc=`uniform vec3 diffuse;
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
}`,fc=`#include <common>
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
}`,dc=`uniform vec3 color;
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
}`,pc=`uniform float rotation;
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
}`,mc=`uniform vec3 diffuse;
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
}`,dt={alphahash_fragment:Ua,alphahash_pars_fragment:Fa,alphamap_fragment:Oa,alphamap_pars_fragment:Ba,alphatest_fragment:za,alphatest_pars_fragment:ka,aomap_fragment:Va,aomap_pars_fragment:Ha,batching_pars_vertex:Ga,batching_vertex:Wa,begin_vertex:Xa,beginnormal_vertex:qa,bsdfs:Ya,iridescence_fragment:Za,bumpmap_pars_fragment:Ja,clipping_planes_fragment:$a,clipping_planes_pars_fragment:Ka,clipping_planes_pars_vertex:Qa,clipping_planes_vertex:ja,color_fragment:to,color_pars_fragment:eo,color_pars_vertex:no,color_vertex:io,common:so,cube_uv_reflection_fragment:ro,defaultnormal_vertex:ao,displacementmap_pars_vertex:oo,displacementmap_vertex:lo,emissivemap_fragment:co,emissivemap_pars_fragment:ho,colorspace_fragment:uo,colorspace_pars_fragment:fo,envmap_fragment:po,envmap_common_pars_fragment:mo,envmap_pars_fragment:go,envmap_pars_vertex:_o,envmap_physical_pars_fragment:Ro,envmap_vertex:xo,fog_vertex:yo,fog_pars_vertex:vo,fog_fragment:Mo,fog_pars_fragment:So,gradientmap_pars_fragment:bo,lightmap_pars_fragment:Eo,lights_lambert_fragment:wo,lights_lambert_pars_fragment:To,lights_pars_begin:Ao,lights_toon_fragment:Co,lights_toon_pars_fragment:Io,lights_phong_fragment:Po,lights_phong_pars_fragment:Lo,lights_physical_fragment:Do,lights_physical_pars_fragment:No,lights_fragment_begin:Uo,lights_fragment_maps:Fo,lights_fragment_end:Oo,lightprobes_pars_fragment:Bo,logdepthbuf_fragment:zo,logdepthbuf_pars_fragment:ko,logdepthbuf_pars_vertex:Vo,logdepthbuf_vertex:Ho,map_fragment:Go,map_pars_fragment:Wo,map_particle_fragment:Xo,map_particle_pars_fragment:qo,metalnessmap_fragment:Yo,metalnessmap_pars_fragment:Zo,morphinstance_vertex:Jo,morphcolor_vertex:$o,morphnormal_vertex:Ko,morphtarget_pars_vertex:Qo,morphtarget_vertex:jo,normal_fragment_begin:tl,normal_fragment_maps:el,normal_pars_fragment:nl,normal_pars_vertex:il,normal_vertex:sl,normalmap_pars_fragment:rl,clearcoat_normal_fragment_begin:al,clearcoat_normal_fragment_maps:ol,clearcoat_pars_fragment:ll,iridescence_pars_fragment:cl,opaque_fragment:hl,packing:ul,premultiplied_alpha_fragment:fl,project_vertex:dl,dithering_fragment:pl,dithering_pars_fragment:ml,roughnessmap_fragment:gl,roughnessmap_pars_fragment:_l,shadowmap_pars_fragment:xl,shadowmap_pars_vertex:yl,shadowmap_vertex:vl,shadowmask_pars_fragment:Ml,skinbase_vertex:Sl,skinning_pars_vertex:bl,skinning_vertex:El,skinnormal_vertex:wl,specularmap_fragment:Tl,specularmap_pars_fragment:Al,tonemapping_fragment:Rl,tonemapping_pars_fragment:Cl,transmission_fragment:Il,transmission_pars_fragment:Pl,uv_pars_fragment:Ll,uv_pars_vertex:Dl,uv_vertex:Nl,worldpos_vertex:Ul,background_vert:Fl,background_frag:Ol,backgroundCube_vert:Bl,backgroundCube_frag:zl,cube_vert:kl,cube_frag:Vl,depth_vert:Hl,depth_frag:Gl,distance_vert:Wl,distance_frag:Xl,equirect_vert:ql,equirect_frag:Yl,linedashed_vert:Zl,linedashed_frag:Jl,meshbasic_vert:$l,meshbasic_frag:Kl,meshlambert_vert:Ql,meshlambert_frag:jl,meshmatcap_vert:tc,meshmatcap_frag:ec,meshnormal_vert:nc,meshnormal_frag:ic,meshphong_vert:sc,meshphong_frag:rc,meshphysical_vert:ac,meshphysical_frag:oc,meshtoon_vert:lc,meshtoon_frag:cc,points_vert:hc,points_frag:uc,shadow_vert:fc,shadow_frag:dc,sprite_vert:pc,sprite_frag:mc},Z={common:{diffuse:{value:new ut(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new at},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new at}},envmap:{envMap:{value:null},envMapRotation:{value:new at},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new at}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new at}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new at},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new at},normalScale:{value:new wt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new at},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new at}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new at}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new at}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ut(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new A},probesMax:{value:new A},probesResolution:{value:new A}},points:{diffuse:{value:new ut(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0},uvTransform:{value:new at}},sprite:{diffuse:{value:new ut(16777215)},opacity:{value:1},center:{value:new wt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new at},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0}}},Or={basic:{uniforms:Xt([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.fog]),vertexShader:dt.meshbasic_vert,fragmentShader:dt.meshbasic_frag},lambert:{uniforms:Xt([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new ut(0)},envMapIntensity:{value:1}}]),vertexShader:dt.meshlambert_vert,fragmentShader:dt.meshlambert_frag},phong:{uniforms:Xt([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new ut(0)},specular:{value:new ut(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:dt.meshphong_vert,fragmentShader:dt.meshphong_frag},standard:{uniforms:Xt([Z.common,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.roughnessmap,Z.metalnessmap,Z.fog,Z.lights,{emissive:{value:new ut(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:dt.meshphysical_vert,fragmentShader:dt.meshphysical_frag},toon:{uniforms:Xt([Z.common,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.gradientmap,Z.fog,Z.lights,{emissive:{value:new ut(0)}}]),vertexShader:dt.meshtoon_vert,fragmentShader:dt.meshtoon_frag},matcap:{uniforms:Xt([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,{matcap:{value:null}}]),vertexShader:dt.meshmatcap_vert,fragmentShader:dt.meshmatcap_frag},points:{uniforms:Xt([Z.points,Z.fog]),vertexShader:dt.points_vert,fragmentShader:dt.points_frag},dashed:{uniforms:Xt([Z.common,Z.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:dt.linedashed_vert,fragmentShader:dt.linedashed_frag},depth:{uniforms:Xt([Z.common,Z.displacementmap]),vertexShader:dt.depth_vert,fragmentShader:dt.depth_frag},normal:{uniforms:Xt([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,{opacity:{value:1}}]),vertexShader:dt.meshnormal_vert,fragmentShader:dt.meshnormal_frag},sprite:{uniforms:Xt([Z.sprite,Z.fog]),vertexShader:dt.sprite_vert,fragmentShader:dt.sprite_frag},background:{uniforms:{uvTransform:{value:new at},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:dt.background_vert,fragmentShader:dt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new at}},vertexShader:dt.backgroundCube_vert,fragmentShader:dt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:dt.cube_vert,fragmentShader:dt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:dt.equirect_vert,fragmentShader:dt.equirect_frag},distance:{uniforms:Xt([Z.common,Z.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:dt.distance_vert,fragmentShader:dt.distance_frag},shadow:{uniforms:Xt([Z.lights,Z.fog,{color:{value:new ut(0)},opacity:{value:1}}]),vertexShader:dt.shadow_vert,fragmentShader:dt.shadow_frag}};Or.physical={uniforms:Xt([Or.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new at},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new at},clearcoatNormalScale:{value:new wt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new at},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new at},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new at},sheen:{value:0},sheenColor:{value:new ut(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new at},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new at},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new at},transmissionSamplerSize:{value:new wt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new at},attenuationDistance:{value:0},attenuationColor:{value:new ut(0)},specularColor:{value:new ut(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new at},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new at},anisotropyVector:{value:new wt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new at}}]),vertexShader:dt.meshphysical_vert,fragmentShader:dt.meshphysical_frag};var gc=new at;gc.set(-1,0,0,0,1,0,0,0,1);var Cm={[Bs]:"LINEAR_TONE_MAPPING",[zs]:"REINHARD_TONE_MAPPING",[ks]:"CINEON_TONE_MAPPING",[Vs]:"ACES_FILMIC_TONE_MAPPING",[Gs]:"AGX_TONE_MAPPING",[Ws]:"NEUTRAL_TONE_MAPPING",[Hs]:"CUSTOM_TONE_MAPPING"};var Im=new Float32Array(16),Pm=new Float32Array(9),Lm=new Float32Array(4);var Dm={[Bs]:"Linear",[zs]:"Reinhard",[ks]:"Cineon",[Vs]:"ACESFilmic",[Gs]:"AgX",[Ws]:"Neutral",[Hs]:"Custom"};var Nm={[gr]:"SHADOWMAP_TYPE_PCF",[_r]:"SHADOWMAP_TYPE_VSM"};var Um={[wr]:"ENVMAP_TYPE_CUBE",[qs]:"ENVMAP_TYPE_CUBE",[Tr]:"ENVMAP_TYPE_CUBE_UV"};var Fm={[qs]:"ENVMAP_MODE_REFRACTION"};var Om={[Os]:"ENVMAP_BLENDING_MULTIPLY",[br]:"ENVMAP_BLENDING_MIX",[Er]:"ENVMAP_BLENDING_ADD"};var _c=new at;_c.set(-1,0,0,0,1,0,0,0,1);var Bm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);function zr(_,t=!1){let e=_[0].index!==null,n=new Set(Object.keys(_[0].attributes)),i=new Set(Object.keys(_[0].morphAttributes)),s={},r={},o=_[0].morphTargetsRelative,a=new le,l=0;for(let c=0;c<_.length;++c){let d=_[c],m=0;if(e!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let y in d.attributes){if(!n.has(y))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+'. All geometries must have compatible attributes; make sure "'+y+'" attribute exists among all geometries, or in none of them.'),null;s[y]===void 0&&(s[y]=[]),s[y].push(d.attributes[y]),m++}if(m!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". Make sure all geometries have the same number of attributes."),null;if(o!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let y in d.morphAttributes){if(!i.has(y))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+".  .morphAttributes must be consistent throughout all geometries."),null;r[y]===void 0&&(r[y]=[]),r[y].push(d.morphAttributes[y])}if(t){let y;if(e)y=d.index.count;else if(d.attributes.position!==void 0)y=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". The geometry must have either an index or a position attribute"),null;a.addGroup(l,y,c),l+=y}}if(e){let c=0,d=[];for(let m=0;m<_.length;++m){let y=_[m].index;for(let b=0;b<y.count;++b)d.push(y.getX(b)+c);c+=_[m].attributes.position.count}a.setIndex(d)}for(let c in s){let d=Br(s[c]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+c+" attribute."),null;a.setAttribute(c,d)}for(let c in r){let d=r[c][0].length;if(d!==0){a.morphAttributes=a.morphAttributes||{},a.morphAttributes[c]=[];for(let m=0;m<d;++m){let y=[];for(let I=0;I<r[c].length;++I)y.push(r[c][I][m]);let b=Br(y);if(!b)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+c+" morphAttribute."),null;a.morphAttributes[c].push(b)}}}return a}function Br(_){let t,e,n,i=-1,s=0;for(let l=0;l<_.length;++l){let c=_[l];if(t===void 0&&(t=c.array.constructor),t!==c.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=c.itemSize),e!==c.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=c.normalized),n!==c.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=c.gpuType),i!==c.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=c.count*e}let r=new t(s),o=new Ot(r,e,n),a=0;for(let l=0;l<_.length;++l){let c=_[l];if(c.isInterleavedBufferAttribute){let d=a/e;for(let m=0,y=c.count;m<y;m++)for(let b=0;b<e;b++){let I=c.getComponent(m,b);o.setComponent(m+d,b,I)}}else r.set(c.array,a);a+=c.count*e}return i!==void 0&&(o.gpuType=i),o}var yc=(()=>{let _={intensity:1,hemi:.12,exposure:1},t={wood:{describe:"timber with visible grain: oak, walnut, pine, plywood, bamboo; bark on a living or fallen tree; the cut end of a log or board",roughness:[.4,.62],metalness:0,tile:.6,size:1024,normal:.4,relief:.4,finishes:{oiled:{roughness:[.4,.62],clearcoat:.18,clearcoatRoughness:.45},lacquered:{roughness:[.3,.45],clearcoat:1,clearcoatRoughness:.08},raw:{roughness:[.66,.86]},bark:{roughness:[.8,.97],pattern:!0,normal:1.1,relief:.9,size:512},endgrain:{roughness:[.62,.82],pattern:!0,normal:.5,relief:.6,tile:.4,size:512}}},metal:{describe:"bare metal: brass, steel, iron, aluminium, copper, chrome",roughness:[.3,.42],metalness:1,tile:.25,size:512,normal:.18,finishes:{brushed:{roughness:[.28,.4],anisotropy:.85},polished:{roughness:[.08,.16]},satin:{roughness:[.42,.55],anisotropy:.3},cast:{roughness:[.55,.75]},rusted:{roughness:[.75,.95],metalness:.35}}},fabric:{describe:"woven or knitted cloth: upholstery, clothing, rugs, curtains, canvas, rope",roughness:[.86,.98],metalness:0,tile:.12,size:512,normal:.5,finishes:{linen:{roughness:[.86,.98],sheen:.45,sheenRoughness:.75},wool:{roughness:[.9,1],sheen:.7,sheenRoughness:.85},velvet:{roughness:[.94,1],sheen:1,sheenRoughness:.5},cotton:{roughness:[.86,.98],sheen:.35,sheenRoughness:.8},denim:{roughness:[.84,.96],sheen:.3,sheenRoughness:.8},canvas:{roughness:[.88,1],sheen:.2,sheenRoughness:.9},knit:{roughness:[.9,1],sheen:.7,sheenRoughness:.85}}},paint:{describe:"an opaque painted or plastered surface over anything: painted wood or metal, walls, lacquer",roughness:[.42,.58],metalness:0,tile:.6,size:256,normal:.3,relief:.3,finishes:{matte:{roughness:[.58,.74]},eggshell:{roughness:[.42,.58]},gloss:{roughness:[.12,.22],clearcoat:.6,clearcoatRoughness:.1}}},ceramic:{describe:"fired clay and porcelain: tiles, crockery, sanitaryware, glazed pots",roughness:[.16,.28],metalness:0,tile:.5,size:256,normal:.12,finishes:{glazed:{roughness:[.14,.24],clearcoat:.8,clearcoatRoughness:.06},matte:{roughness:[.5,.64]}}},leather:{describe:"leather, hide without hair, and bare animal skin such as a nose or paw pad",roughness:[.46,.64],metalness:0,tile:.25,size:512,normal:.7,finishes:{grain:{roughness:[.46,.64],sheen:.15,sheenRoughness:.6},patent:{roughness:[.1,.2],clearcoat:1,clearcoatRoughness:.05,relief:.12}}},rubber:{describe:"rubber and soft matte polymers: tyres, soles, gaskets, grips",roughness:[.7,.86],metalness:0,tile:.2,size:256,normal:.3,finishes:{black:{roughness:[.7,.86]}}},fur:{describe:"the coat of an animal: fur, hair, mane, feathers",roughness:[.7,.92],metalness:0,tile:.16,size:512,normal:.7,body:1.45,bodyClamp:[.18,1.35],finishes:{short:{roughness:[.72,.92],sheen:.6,sheenRoughness:.6},long:{roughness:[.68,.9],sheen:.8,sheenRoughness:.5},plush:{roughness:[.85,1],sheen:1,sheenRoughness:.8},sculpted:{roughness:[.55,.74],relief:.2,sheen:.45,sheenRoughness:.45,sheenWhite:.12}}},keratin:{describe:"hoof, claw, horn, beak, shell, bone, tooth",roughness:[.3,.48],metalness:0,tile:.1,size:256,normal:.25,finishes:{natural:{roughness:[.3,.48],clearcoat:.35,clearcoatRoughness:.3},polished:{roughness:[.12,.22],clearcoat:.9,clearcoatRoughness:.08}}},stone:{describe:"stone, rock, concrete, brick, plaster left rough, slate, marble",roughness:[.78,.96],metalness:0,tile:.45,size:512,normal:.85,finishes:{rough:{roughness:[.8,.97]},concrete:{roughness:[.7,.9]},polished:{roughness:[.12,.28],clearcoat:.5,clearcoatRoughness:.15}}},snow:{describe:"snow, frost, ice crust",roughness:[.8,1],metalness:0,tile:.35,size:256,normal:.45,finishes:{powder:{roughness:[.85,1],sheen:.5,sheenRoughness:.9},ice:{roughness:[.08,.2],clearcoat:.8,clearcoatRoughness:.1}}},foliage:{describe:"living plant matter: leaves, petals, grass, moss, stems, fruit skin; and the CUT-OUT finishes a card wears (spray, needles, grass)",roughness:[.45,.72],metalness:0,tile:.1,size:256,normal:.4,finishes:{leaf:{roughness:[.42,.68],sheen:.25,sheenRoughness:.5},petal:{roughness:[.55,.8],sheen:.5,sheenRoughness:.7},moss:{roughness:[.85,1],sheen:.6,sheenRoughness:.9},spray:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},needles:{roughness:[.72,.94],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},grass:{roughness:[.7,.92],specular:.25,glance:.12,pattern:!0,cutout:!0,size:512,normal:.3},core:{roughness:[.92,1],specular:.05,glance:.08,pattern:!0,size:256,tile:.3,normal:.5,crease:80,twoSided:!0}}},soil:{describe:"loose ground: soil, dirt, sand, gravel, mud, ash",roughness:[.88,1],metalness:0,tile:.3,size:512,normal:.9,finishes:{dry:{roughness:[.9,1]},wet:{roughness:[.35,.6]},sand:{roughness:[.85,.98]}}},glass:{describe:"glass and glossy screens, kept SOLID and tinted (never see-through): windows, bottles, lenses, monitor faces",roughness:[.03,.09],metalness:0,tile:.6,size:128,normal:.05,finishes:{clear:{roughness:[.03,.08],clearcoat:1,clearcoatRoughness:.03},frosted:{roughness:[.35,.55]}}},plastic:{describe:"moulded plastic, resin, vinyl, bakelite, acrylic",roughness:[.32,.5],metalness:0,tile:.4,size:256,normal:.15,relief:.3,finishes:{satin:{roughness:[.32,.5]},matte:{roughness:[.55,.72]},gloss:{roughness:[.06,.16],clearcoat:.6,clearcoatRoughness:.08},translucent:{roughness:[.03,.09],clearcoat:1,clearcoatRoughness:.04,transmission:.6,thickness:.012,ior:1.54}}},emissive:{describe:"something that GIVES light: flame, lamp shade when lit, bulb, screen glow, embers, neon",roughness:[.5,.7],metalness:0,tile:.4,size:128,normal:.05,finishes:{glow:{roughness:[.5,.7],emissive:1.4},flame:{roughness:[.6,.8],emissive:2.6,fire:!0,crease:80},screen:{roughness:[.1,.2],emissive:.9,clearcoat:.8,clearcoatRoughness:.05}}},skin:{describe:"bare skin: human skin (natural; soft for a stylised HD face), and the smooth wet skin of sharks, dolphins, whales, fish, eels, frogs and other water animals (wet)",roughness:[.48,.66],metalness:0,tile:.08,size:256,normal:.3,finishes:{natural:{roughness:[.48,.66],sheen:.25,sheenRoughness:.5},wet:{roughness:[.26,.4],relief:.12,clearcoat:.35,clearcoatRoughness:.3},soft:{roughness:[.5,.62],relief:.08,sheen:.18,sheenRoughness:.6}}},paper:{describe:"paper, card, books, cardboard, parchment",roughness:[.82,.96],metalness:0,tile:.2,size:256,normal:.35,relief:.5,finishes:{plain:{roughness:[.82,.96]},glossy:{roughness:[.25,.4]}}}},e=["kind","finish","describe","grain","crease","blend","intensity","must"],n={floor:750,perM2:2e3,exponent:.85,cap:5e4,overFlat:15};function i(h,u=null,p=null){let f=Math.max(0,Number(h?.x)||0),g=Math.max(0,Number(h?.y)||0),M=Math.max(0,Number(h?.z)||0),w=f*g+g*M+f*M,S=Number(p)>0?Math.min(w,Number(p)):w,x=Math.min(n.cap,n.floor+n.perM2*Math.pow(S,n.exponent));return Number(u)>0&&(x=Math.max(n.floor,Math.min(x,n.overFlat*Number(u)))),Math.round(x)}function s(h,u,p){let f=h*374761393+u*668265263+p*1442695041|0;return f=Math.imul(f^f>>>13,1274126177),f^=f>>>16,(f>>>0)/4294967296}let r=h=>h*h*(3-2*h);function o(h,u,p,f,g){let M=Math.floor(h),w=Math.floor(u),S=r(h-M),x=r(u-w),E=(M%p+p)%p,v=(w%f+f)%f,T=(E+1)%p,R=(v+1)%f,C=s(E,v,g),L=s(T,v,g),P=s(E,R,g),O=s(T,R,g);return C+(L-C)*S+(P+(O-P)*S-(C+(L-C)*S))*x}function a(h,u,p,f,g,M=4){let w=0,S=.5,x=0,E=p,v=f;for(let T=0;T<M;T++)w+=S*o(h*E,u*v,E,v,g+T*101),x+=S,S*=.5,E*=2,v*=2;return w/x}function l(h,u,p,f){let g=h*374761393+u*668265263+p*2246822519+f*1442695041|0;return g=Math.imul(g^g>>>13,1274126177),g^=g>>>16,(g>>>0)/4294967296}function c(h,u,p,f=1){let g=Math.floor(h),M=Math.floor(u),w=Math.floor(p),S=r(h-g),x=r(u-M),E=r(p-w),v=(R,C,L)=>l(g+R,M+C,w+L,f),T=(R,C,L)=>R+(C-R)*L;return T(T(T(v(0,0,0),v(1,0,0),S),T(v(0,1,0),v(1,1,0),S),x),T(T(v(0,0,1),v(1,0,1),S),T(v(0,1,1),v(1,1,1),S),x),E)}function d(h,u,p,f=1,g=3){let M=0,w=.5,S=0,x=1;for(let E=0;E<g;E++)M+=w*c(h*x,u*x,p*x,f+E*7),S+=w,w*=.5,x*=2;return M/S}let m={wood(h,u,p){let f=a(h,u,1,4,p+71)-.5,g=a(h,u,2,2,p)-.5,M=u*72+f*4+g*.6,w=.5+.5*Math.sin(2*Math.PI*M),S=.4+1.2*a(h,u,1,6,p+41),x=Math.pow(w,1.5+2.5*S),E=a(h,u,1,2,p+83)-.5,v=.5+.5*Math.sin(2*Math.PI*(u*7+g*1.4+E*.8)),T=Math.pow(v,1.6)*(.5+a(h,u,1,3,p+97)),R=a(h,u,3,128,p+13),C=a(h,u,8,256,p+29),L=a(h,u,1,1,p+3),P=Math.pow(a(h,u,16,3,p+57),6),O=.3*x+.25*T+.3*R+.15*C,H=1-.035*x-.075*T-.04*(R-.5)-.02*(C-.5)-.06*(L-.5)+.03*P,Y=[1,1-.07*T-.03*x,1-.16*T-.06*x];return{h:O,L:H,T:Y,r:.35*x+.3*T+.35*R}},"wood:bark"(h,u,p){let f=a(h,u,2,14,p+5,3),g=a(h,u,4,34,p+29,3),M=Math.abs(2*f-1),w=Math.abs(2*g-1),S=Math.max(0,1-M/.16),x=Math.max(0,1-w/.1),E=Math.max(S*S,.6*x*x),v=a(h,u,9,4,p+11,2),T=a(h,u,40,80,p+17,2),C=.55*Math.pow(Math.min(M/.6,1),.7)*(1-E)+.25*(v-.5)+.2*T,L=.98-.55*E+.14*(v-.5)+.06*(T-.5),P=[1,.95-.1*E,.86-.18*E];return{h:C,L,T:P,r:.45+.55*E+.1*(T-.5)}},"wood:endgrain"(h,u,p){let f=h-.5,g=u-.5,M=Math.hypot(f,g),w=Math.atan2(g,f),S=a(h,u,2,2,p+7)-.5,x=a(h,u,1,1,p+19)-.5,E=M*24+S*1.2+x*2.5,v=.5+.5*Math.sin(2*Math.PI*E),R=Math.pow(v,2.2)*(.5+.8*a(h,u,3,3,p+31,2)),C=Math.pow(Math.max(0,Math.cos(w*7+S*6)),40)*Math.min(1,M*3),L=a(h,u,40,40,p+23),P=.5*R+.3*L-.6*C,O=.93-.12*R-.04*(L-.5)-.3*C+.05*(M<.03?1:0),H=[1,.97-.05*R,.92-.1*R];return{h:P,L:O,T:H,r:.5+.4*R+.1*L}},"foliage:spray"(h,u,p){let f=null;for(let x=0;x<44;x++){let E=.4*Math.pow(s(x,1,p),.6),v=s(x,2,p)*Math.PI*2,T=.5+E*Math.cos(v),R=.5+E*Math.sin(v),C=s(x,3,p)*Math.PI,L=.075+.055*s(x,4,p),P=L*(.42+.2*s(x,5,p)),O=Math.cos(C),H=Math.sin(C),Y=(h-T)*O+(u-R)*H,k=-(h-T)*H+(u-R)*O,W=Y/L;if(Math.abs(W)>1)continue;let V=P*Math.sqrt(1-W*W)*(1-.28*(W+1)/2);Math.abs(k)<V&&(f={i:x,t:W,yn:k/V,w:V,y:k})}if(!f)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let g=.86+.26*s(f.i,6,p),M=Math.abs(f.y)<.045*f.w+.004?1:0,w=Math.pow(Math.abs(f.yn),1.5),S=g*(.98-.12*M+.06*w)*(1-.1*(f.t+1)/2);return{h:.5+.3*(1-Math.abs(f.yn))-.3*M,L:S,T:[1-.05*M,1,1-.08*w],r:.65-.2*M,a:1}},"foliage:needles"(h,u,p){let f=Math.abs(u-.5)<.006&&h>.06&&h<.9,g=null;for(let w=0;w<180;w++){let S=w%2?1:-1,x=.08+.82*s(w,1,p),E=S*(.95+.45*(s(w,2,p)-.5))-.35,v=Math.cos(E),T=Math.sin(E),R=.22+.16*s(w,3,p),C=.013;if(v>.001&&(R=Math.min(R,(.94-x)/v)),Math.abs(T)>.001&&(R=Math.min(R,.44/Math.abs(T))),R<.03)continue;let L=(h-x)*v+(u-.5)*T,P=-(h-x)*T+(u-.5)*v;L<0||L>R||Math.abs(P)>C*(1-.6*L/R)||(g={i:w,t:L/R,yn:P/C})}if(f&&!g)return{h:.6,L:.7,T:[1,.9,.8],r:.8,a:1};if(!g)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let M=.8+.28*s(g.i,4,p);return{h:.5+.3*(1-Math.abs(g.yn)),L:M*(.9+.1*g.t),T:[1,1,1],r:.6,a:1}},"foliage:core"(h,u,p){let f=null;for(let M=0;M<90;M++){let w=s(M,1,p),S=s(M,2,p),x=(h-w+1.5)%1-.5,E=(u-S+1.5)%1-.5,v=s(M,3,p)*Math.PI,T=.09+.06*s(M,4,p),R=T*.45,C=Math.cos(v),L=Math.sin(v),P=x*C+E*L,O=-x*L+E*C,H=P/T;if(Math.abs(H)>1)continue;let Y=R*Math.sqrt(1-H*H);Math.abs(O)<Y&&(f={i:M,t:H,yn:O/Y})}if(!f)return{h:.3,L:.45,T:[1,1,1],r:.9,a:1};let g=.55+.35*s(f.i,6,p);return{h:.5+.3*(1-Math.abs(f.yn)),L:g*(.92+.06*f.t),T:[1,1,1],r:.7,a:1}},"foliage:grass"(h,u,p){let f=null;for(let M=0;M<17;M++){let w=.28+.44*s(M,1,p),S=(s(M,2,p)-.5)*.8,x=.5+.45*s(M,3,p),E=u/x;if(E>1)continue;let v=w+S*E*E,T=.02*(1-E)+.002;Math.abs(h-v)<T&&(f={i:M,t:E,yn:(h-v)/T})}if(!f)return{h:.5,L:.55,T:[1,1,1],r:.6,a:0};let g=.82+.3*s(f.i,4,p);return{h:.5+.3*(1-Math.abs(f.yn)),L:g*(.86+.18*f.t),T:[1-.05*f.t,1,.9],r:.6,a:1}},metal(h,u,p){let f=a(h,u,1,96,p),g=a(h,u,2,256,p+9),M=a(h,u,5,5,p+3);return{h:.6*f+.25*g+.15*M,L:.955+.045*f,r:.6*f+.2*g+.2*M}},fabric(h,u,p,f){let g=f==="wool"?48:f==="velvet"?80:64,M=Math.abs(Math.sin(Math.PI*h*g)),w=Math.abs(Math.sin(Math.PI*u*g)),S=.5+.5*Math.sin(Math.PI*h*g)*Math.sin(Math.PI*u*g),x=a(h,u,6,6,p),E=a(h,u,2,24,p+5),v=.55*Math.max(M,w)+.25*S+.2*x,T=f==="velvet"?.7*x+.3*v:v+.12*(E-.5),R=.95+.04*Math.max(M,w)-.05*(x-.5)-(f==="linen"?.05*Math.max(0,E-.6):0),C=[1,1-.02*S,1-.04*S];return{h:T,L:R,T:C,r:.5+.5*x}},paint(h,u,p){let f=a(h,u,12,12,p),g=a(h,u,3,3,p+11);return{h:.8*f+.2*g,L:.98+.02*f,r:.9*f+.1*g}},ceramic(h,u,p){let f=a(h,u,4,4,p);return{h:f,L:.985+.015*f,r:f}},leather(h,u,p){let f=a(h,u,18,18,p),g=a(h,u,3,3,p+17);return{h:.75*f+.25*g,L:.94+.06*f-.04*(g-.5),r:.5+.5*f}},rubber(h,u,p){let f=a(h,u,10,10,p);return{h:f,L:.96+.04*f,r:.5+.5*f}},fur(h,u,p,f){let g=f==="long",M=f==="plush",w=g?2:M?6:4,S=g?20:M?24:32,x=h+.06*(a(h,u,3,3,p+31)-.5),E=u+.025*(a(h,u,4,4,p+37)-.5),v=(Math.floor(E*S)%S+S)%S,T=x*w+s(v,7,p)*1.7,R=(Math.floor(T)%w+w)%w,C=T-Math.floor(T),L=E*S-Math.floor(E*S),P=s(R,v,p+3),O=s(v,R,p+5),H=.55+.45*P,Y=C<H?Math.pow(Math.sin(Math.PI*C/H),.6):0,k=Math.pow(Math.sin(Math.PI*L),.8),W=Y*k*(.55+.45*O),V=a(h,u,g?2:4,g?96:192,p),G=a(h,u,2,2,p+21),Q=(M?.4:.6)*W+.4*V,it=.94+.07*W+.04*(V-.5)-.07*(G-.5),yt=[1,1-.03*(1-W),1-.06*(1-W)];return{h:Q,L:it,T:yt,r:.5*(1-W)+.5*V}},stone(h,u,p,f){let g=a(h,u,3,3,p),M=a(h,u,9,9,p+7),w=Math.pow(a(h,u,28,28,p+15),3),S=f==="concrete"?a(h,u,40,40,p+23):M;return{h:.45*g+.35*S-.35*w,L:.9+.12*(g-.5)+.06*(S-.5)-.1*w,T:[1,1-.02*g,1-.05*g],r:.5*S+.5*g}},snow(h,u,p){let f=a(h,u,3,3,p),g=a(h,u,40,40,p+5);return{h:.7*f+.3*g,L:.96+.04*g,T:[.985,.995,1],r:g}},foliage(h,u,p){let f=Math.pow(Math.abs(Math.sin(Math.PI*u*10+(a(h,u,3,3,p)-.5)*2)),8),g=a(h,u,24,24,p+9);return{h:.6*f+.4*g,L:.93+.07*g-.06*f,T:[1-.04*g,1,1-.06*g],r:.6*g+.4*(1-f)}},soil(h,u,p){let f=a(h,u,8,8,p),g=a(h,u,48,48,p+11),M=Math.pow(a(h,u,16,16,p+19),5);return{h:.5*f+.3*g+.4*M,L:.88+.14*(f-.5)+.08*(g-.5)+.1*M,r:g}},glass(h,u,p){let f=a(h,u,3,3,p);return{h:f,L:.99+.01*f,r:f}},plastic(h,u,p){let f=a(h,u,30,30,p);return{h:f,L:.985+.015*f,r:f}},emissive(h,u,p){let f=a(h,u,4,4,p);return{h:f,L:.97+.03*f,r:f}},skin(h,u,p){let f=a(h,u,48,48,p),g=a(h,u,3,3,p+3);return{h:f,L:.97+.03*(f-.5)-.03*(g-.5),T:[1,1-.015*g,1-.02*g],r:f}},paper(h,u,p){let f=a(h,u,6,60,p),g=a(h,u,5,5,p+7);return{h:.7*f+.3*g,L:.96+.04*(f-.5)-.03*(g-.5),r:f}},keratin(h,u,p){let f=.5+.5*Math.sin(2*Math.PI*(h*6+(a(h,u,2,2,p)-.5)*.8)),g=a(h,u,2,48,p+5);return{h:.5*f+.5*g,L:.95+.05*g-.04*Math.pow(f,3),r:.5*f+.5*g}}},y=globalThis[Symbol.for("polyfork.materials.maps")]??=new Map;y.has("186")||y.set("186",new Map);let b=y.get("186"),I=(h,u)=>{let p=u>>>0;for(let f=0;f<h.length;f++)p=Math.imul(p^h[f],16777619);return(p>>>0).toString(16).padStart(8,"0")},N=h=>I(h,2166136261)+I(h,2538058380);function B(h,u,p,f){let g=N(h),M=`tex:${p?"s":"l"}:${u}:${g}`;if(b.has(M))return b.get(M);let w=new zn(h,u,u,Vi);return w.wrapS=w.wrapT=Nn,w.minFilter=ki,w.magFilter=zi,w.generateMipmaps=!0,w.anisotropy=8,p&&(w.colorSpace=Zt),w.name=f,w.userData.pfHash=g,w.needsUpdate=!0,b.set(M,w),w}let D=(h,u=null)=>(m[h]||m.paint).length>=4||!!(u&&t[h]&&t[h].finishes[u]&&t[h].finishes[u].pattern);function z(h,u,p){let f=t[h]||t.paint,g=D(h,u),M=`pattern:${h}:${g?u:"*"}:${p}`;if(b.has(M))return b.get(M);let w=f.finishes[u]||{},S=g&&w.size||f.size,x=S*S,E=g&&m[`${h}:${u}`]||m[h]||m.paint,v=new Float32Array(x),T=new Float32Array(x),R=new Uint8Array(x*4),C=new Uint8Array(x*4),L=Y=>Math.max(0,Math.min(1,Y));for(let Y=0;Y<S;Y++)for(let k=0;k<S;k++){let W=Y*S+k,V=E(k/S,Y/S,p,u);v[W]=V.h,T[W]=L(V.r);let G=L(V.L),Q=V.T||[1,1,1];R[W*4]=Math.round(L(G*Q[0])*255),R[W*4+1]=Math.round(L(G*Q[1])*255),R[W*4+2]=Math.round(L(G*Q[2])*255),R[W*4+3]=Math.round(L(V.a??1)*255)}if(R.some((Y,k)=>(k&3)===3&&Y<128)){let Y=new Uint8Array(x);for(let k=0;k<x;k++)Y[k]=R[k*4+3]>=128?1:0;for(let k=0;k<6;k++){let W=[];for(let V=0;V<S;V++)for(let G=0;G<S;G++){let Q=V*S+G;if(Y[Q])continue;let it=0,yt=0,bt=0,Rt=0,mt=0;for(let[st,j]of[[1,0],[-1,0],[0,1],[0,-1]]){let nt=(V+j+S)%S*S+(G+st+S)%S;Y[nt]&&(it+=v[nt],yt+=R[nt*4],bt+=R[nt*4+1],Rt+=R[nt*4+2],mt++)}mt&&W.push([Q,it/mt,yt/mt,bt/mt,Rt/mt])}if(!W.length)break;for(let[V,G,Q,it,yt]of W)v[V]=G,R[V*4]=Q,R[V*4+1]=it,R[V*4+2]=yt,Y[V]=1}}let P=(g&&w.normal||f.normal)*S*.02;for(let Y=0;Y<S;Y++)for(let k=0;k<S;k++){let W=Y*S+k,V=(v[Y*S+(k+1)%S]-v[Y*S+(k-1+S)%S])*P,G=(v[(Y+1)%S*S+k]-v[(Y-1+S)%S*S+k])*P,Q=Math.hypot(V,G,1);C[W*4]=Math.round((-V/Q*.5+.5)*255),C[W*4+1]=Math.round((-G/Q*.5+.5)*255),C[W*4+2]=Math.round((1/Q*.5+.5)*255),C[W*4+3]=255}let O=g?`${h}-${u}`:h,H={S,R:T,map:B(R,S,!0,`${O}-albedo`),normalMap:B(C,S,!1,`${O}-normal`)};return b.set(M,H),H}function U(h,u=null,p=1){let f=t[h]||t.paint,g=u&&f.finishes[u]?u:Object.keys(f.finishes)[0],M=`${h}:${g}:${p}`;if(b.has(M))return b.get(M);let w=z(h,g,p),[S,x]=f.finishes[g].roughness||f.roughness,E=w.S*w.S,v=new Uint8Array(E*4);for(let R=0;R<E;R++)v[R*4+1]=Math.round((S+(x-S)*w.R[R])*255),v[R*4+2]=255,v[R*4+3]=255;let T={map:w.map,roughnessMap:B(v,w.S,!1,`${h}-${g}-orm`),normalMap:w.normalMap,tile:f.tile};return b.set(M,T),T}function q(h,u,p=""){let f=h&&typeof h=="object"?h:{kind:"paint"},g=t[f.kind]?f.kind:"paint",M=t[g],w=f.finish&&M.finishes[f.finish]?f.finish:Object.keys(M.finishes)[0],S=M.finishes[w],x=U(g,w,f.seed??1),E=new ut(u??"#cccccc"),v=new Hn({color:E,map:x.map,roughnessMap:x.roughnessMap,metalnessMap:x.roughnessMap,roughness:1,metalness:f.metalness??S.metalness??M.metalness,normalMap:x.normalMap,normalScale:new wt(1,-1).multiplyScalar(f.normal??S.relief??M.relief??1),envMapIntensity:1,vertexColors:!0});return S.sheen&&(v.sheen=S.sheen,v.sheenRoughness=S.sheenRoughness??.7,v.sheenColor=E.clone().lerp(new ut("#ffffff"),(S.sheenWhite??.55)*(f.whiten??1)),v.userData.sheenWhite=(S.sheenWhite??.5)*(f.whiten??1)),S.clearcoat&&(v.clearcoat=S.clearcoat,v.clearcoatRoughness=S.clearcoatRoughness??.1),S.anisotropy&&(v.anisotropy=S.anisotropy,v.anisotropyRotation=0),S.transmission&&(v.transmission=f.transmission??S.transmission,v.thickness=f.thickness??S.thickness??.01,v.ior=S.ior??1.5,v.attenuationColor=E.clone(),v.attenuationDistance=f.attenuationDistance??.03),S.emissive&&(v.emissive=E.clone(),v.emissiveIntensity=f.intensity??S.emissive,v.userData.emits=!0),S.fire&&$(v,f.intensity??S.emissive),S.cutout&&(v.alphaTest=.5,v.alphaToCoverage=!1,v.side=Ae,v.shadowSide=Ae,v.transparent=!1,v.userData.cutout=!0),S.specular!==void 0&&(v.specularIntensity=S.specular),S.glance!==void 0&&rt(v,S.glance),S.twoSided&&(v.side=Ae,v.shadowSide=Ae),v.name=p,v}let J=globalThis[Symbol.for("polyfork.fires")]||={set:new Set,loop:!1};function $(h,u=2.6){let p={uTime:{value:1.7},uBase:{value:0},uHeight:{value:1},uFire:{value:u}};h.userData.fire=p,h.transparent=!1,h.alphaTest=.5,h.alphaToCoverage=!0,h.side=Ae,h.shadowSide=Ae;let f=h.onBeforeCompile,g=h.customProgramCacheKey;return h.customProgramCacheKey=()=>`${g?g.call(h):""}|pf-fire`,h.onBeforeCompile=(M,w)=>{f&&f.call(h,M,w),Object.assign(M.uniforms,p),M.vertexShader=M.vertexShader.replace("#include <common>",`#include <common>
uniform float uTime; uniform float uBase; uniform float uHeight; varying vec3 vPfPos; varying float vPfH; varying float vPfEdge;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	float pfH = clamp((position.y - uBase) / max(uHeight, 1e-3), 0.0, 1.0);
	float pfS = pfH * pfH * uHeight * 0.10;
	transformed.x += sin(uTime * 6.3 + position.y * 7.0 + position.z * 3.0) * pfS;
	transformed.z += cos(uTime * 5.1 + position.y * 6.0 + position.x * 3.0) * pfS;
	transformed.y += sin(uTime * 8.0 + position.x * 5.0) * pfS * 0.5;
	vPfPos = transformed; vPfH = pfH;
	vPfEdge = abs(dot(normalize(normalMatrix * normal), normalize(-(modelViewMatrix * vec4(transformed, 1.0)).xyz)));   // 1 facing the eye, 0 at the silhouette`),M.fragmentShader=M.fragmentShader.replace("#include <common>",`#include <common>
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
	totalEmissiveRadiance = pfRamp * uFire * (0.35 + 0.85 * pfHeat);   // red edges glow, the core burns`)},J.set.add(h),X(),h}function X(){if(J.loop||typeof requestAnimationFrame!="function")return;J.loop=!0;let h=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches,u=p=>{h||tt(p/1e3),requestAnimationFrame(u)};requestAnimationFrame(u)}function tt(h){for(let u of J.set){let p=u.userData.fire;p&&(p.uTime.value=h)}}function et(h){let u=[];if(h.updateMatrixWorld(!0),h.traverse(x=>{if(!x.isMesh||!x.geometry)return;let E=[].concat(x.material||[]).map(T=>T&&T.userData.fire).filter(Boolean);if(!E.length)return;x.geometry.boundingBox||x.geometry.computeBoundingBox();let v=x.geometry.boundingBox.clone().applyMatrix4(x.matrixWorld);x.castShadow=!1,x.receiveShadow=!1,u.push({o:x,us:E,wb:v})}),!u.length)return 0;let p=u.map((x,E)=>E),f=x=>{for(;p[x]!==x;)p[x]=p[p[x]],x=p[x];return x};for(let x=0;x<u.length;x++)for(let E=x+1;E<u.length;E++){let v=u[x].wb.clone().expandByScalar(.1*u[x].wb.getSize(new A).length()),T=u[E].wb;if(v.intersectsBox(T)){let R=f(x),C=f(E);R!==C&&(p[R]=C)}}let g=new Map;u.forEach((x,E)=>{let v=f(E);g.has(v)?g.get(v).union(x.wb):g.set(v,x.wb.clone())});let M=new Gt,w=new A,S=new A;return u.forEach((x,E)=>{let v=g.get(f(E)),T=v.getCenter(new A);M.copy(x.o.matrixWorld).invert(),w.set(T.x,v.min.y,T.z).applyMatrix4(M),S.set(T.x,v.max.y,T.z).applyMatrix4(M);for(let R of x.us)R.uBase.value=Math.min(w.y,S.y),R.uHeight.value=Math.max(.02,Math.abs(S.y-w.y))}),u.length}function rt(h,u){let p=h.onBeforeCompile,f=h.customProgramCacheKey,g=Number(u).toFixed(3);h.customProgramCacheKey=()=>`${f?f.call(h):""}|pf-glance-${g}`,h.onBeforeCompile=(M,w)=>{p&&p.call(h,M,w),M.fragmentShader=M.fragmentShader.replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
	reflectedLight.directSpecular *= ${g};
	reflectedLight.indirectSpecular *= ${g};`)},h.userData.glance=u}function ot(h,u=.5,p=null,f=0){let M=h.attributes.position.count,w=new Float32Array(M*2);return lt(h,w,0,M,u,p,f)}function lt(h,u,p,f,g=.5,M=null,w=0,S=null){let x=h.attributes.position,E=p+f,v=new A,T=new A,R=new A,C=new A,L=1/g;if(Array.isArray(M)&&M.length===3){let P=new A(M[0],M[1],M[2]).normalize(),O=new A;for(let H=p;H<E;H+=3){v.fromBufferAttribute(x,H),T.fromBufferAttribute(x,H+1),R.fromBufferAttribute(x,H+2),C.subVectors(T,v).cross(R.clone().sub(v)).normalize(),O.crossVectors(C,P),O.lengthSq()<1e-8&&O.set(1,0,0).cross(P),O.normalize();for(let Y=0;Y<3;Y++){let k=Y===0?v:Y===1?T:R;u[(H+Y)*2]=k.dot(P)*L+w,u[(H+Y)*2+1]=k.dot(O)*L+w*.37}}return h.setAttribute("uv",new Ot(u,2)),h}for(let P=p;P<E;P+=3){v.fromBufferAttribute(x,P),T.fromBufferAttribute(x,P+1),R.fromBufferAttribute(x,P+2),C.subVectors(T,v).cross(R.clone().sub(v));let O=Math.abs(C.x),H=Math.abs(C.y),Y=Math.abs(C.z),k;O>=H&&O>=Y?k=M==="z"?["z","y"]:["y","z"]:H>=Y?k=M==="z"?["z","x"]:["x","z"]:k=M==="x"?["x","y"]:["y","x"];for(let W=0;W<3;W++){let V=W===0?v:W===1?T:R;u[(P+W)*2]=V[k[0]]*L+w,u[(P+W)*2+1]=V[k[1]]*L+w*.37}}return h.setAttribute("uv",new Ot(u,2)),h}function vt(h,u=30){let p=h.attributes.position,f=p.count,g=f/3,M=new Float32Array(g*3),w=new Float32Array(g),S=new A,x=new A,E=new A,v=new A;for(let P=0;P<g;P++){S.fromBufferAttribute(p,P*3),x.fromBufferAttribute(p,P*3+1),E.fromBufferAttribute(p,P*3+2),v.subVectors(x,S).cross(E.clone().sub(S));let O=v.length();w[P]=O,O>1e-14&&v.divideScalar(O),M[P*3]=v.x,M[P*3+1]=v.y,M[P*3+2]=v.z}let T=1e4,R=new Map;for(let P=0;P<f;P++){let O=`${Math.round(p.getX(P)*T)},${Math.round(p.getY(P)*T)},${Math.round(p.getZ(P)*T)}`,H=R.get(O);H||(H=[],R.set(O,H)),H.push(P)}let C=Math.cos(u*Math.PI/180),L=new Float32Array(f*3);for(let P of R.values())for(let O of P){let H=O/3|0,Y=M[H*3],k=M[H*3+1],W=M[H*3+2],V=0,G=0,Q=0;for(let yt of P){let bt=yt/3|0,Rt=M[bt*3],mt=M[bt*3+1],st=M[bt*3+2];Y*Rt+k*mt+W*st<C||(V+=Rt*w[bt],G+=mt*w[bt],Q+=st*w[bt])}let it=Math.hypot(V,G,Q);it<1e-12?(V=Y,G=k,Q=W):(V/=it,G/=it,Q/=it),L[O*3]=V,L[O*3+1]=G,L[O*3+2]=Q}return h.setAttribute("normal",new Ot(L,3)),h}function ct(h,{amp:u=.004,scale:p=.12,seed:f=1}={}){vt(h,180);let g=h.attributes.position,M=h.attributes.normal,w=g.count,S=1/p;for(let x=0;x<w;x++){let E=g.getX(x),v=g.getY(x),T=g.getZ(x),R=(d(E*S,v*S,T*S,f)-.5)*2*u;g.setXYZ(x,E+M.getX(x)*R,v+M.getY(x)*R,T+M.getZ(x)*R)}return h.deleteAttribute("normal"),h}function Dt(h,u=[]){let p=h.index?h.toNonIndexed():h;p===h&&(p=h.clone());for(let f of Object.keys(p.attributes))f!=="position"&&!u.includes(f)&&p.deleteAttribute(f);return p}function Mt(h){let u=t[h.kind]||t.paint,p=u.finishes[h.finish]||{};return h.tile??p.tile??u.tile}function It(h,{name:u="part",colors:p={},materials:f={},crease:g=30}={}){let M=new Map;for(let S of h){if(!S||!S.g)continue;let x=S.zone??"body",E=f[x]||{kind:"paint"};M.has(x)||M.set(x,[]);let v=S.uv==="own"&&S.g.getAttribute("uv")?Dt(S.g,["uv"]):ot(Dt(S.g),Mt(E),S.grain??E.grain??null,S.shift??0),T=Math.max(.2,Math.min(1.25,S.tone??1)),R=v.attributes.position.count,C=new Float32Array(R*3).fill(T);v.setAttribute("color",new Ot(C,3)),M.get(x).push(v)}let w=new yn;w.name=u;for(let[S,x]of M){let E=f[S]||{kind:"paint"},v=x.length===1?x[0]:zr(x),T=t[E.kind]&&t[E.kind].finishes[E.finish]?t[E.kind].finishes[E.finish].crease:void 0;vt(v,T!==void 0?Math.max(E.crease??0,T):E.crease??g);let R=new Bn(v,q(E,p[S],S));R.name=`${u}-${S}`,R.castShadow=R.receiveShadow=!0,w.add(R)}return et(w),w}function xt(h,u,p=null){return!(u?.transmission>0)||!("transmission"in h)||(h.transmission=u.transmission,h.thickness=u.thickness??0,h.ior=u.ior??1.5,u.attenuationColor&&h.attenuationColor.copy(u.attenuationColor),h.attenuationDistance=u.attenuationDistance??1/0,h.normalMap=null,h.roughnessMap=null,h.metalnessMap=null,h.roughness=Math.min(h.roughness,.08),h.metalness=0,h.side=Ae,h.needsUpdate=!0,p&&(p.castShadow=!1,p.renderOrder=Math.max(p.renderOrder,1))),h}function At(h,u={},{force:p=!1,cache:f=null}={}){let g=0;return h.traverse(M=>{if(!M.isMesh||!M.material)return;let S=(Array.isArray(M.material)?M.material:[M.material]).map(x=>{if(!x||!x.name||!u[x.name]||!p&&x.map)return x;let E=x.userData&&x.userData.authoredColor,T="#"+(E?new ut().fromArray(E.baseColorFactor):x.color).getHexString(),R=!!M.geometry.attributes.color,C=E&&R?E.vertexScale:null,L=x.transmission>0?"|t"+x.transmission:"",P=x.name+"|"+T+"|"+R+L+(C?"|"+C.join(","):""),O=f&&f.get(P);return O||(O=xt(q(u[x.name],T,x.name),x),O.vertexColors=R,C&&(O.color.multiply(new ut().fromArray(C)),O.userData.vertexScale=C),f&&(f.set(P,O),O.dispose=()=>{})),L&&xt(O,x,M),g++,O});M.material=Array.isArray(M.material)?S:S[0]}),g&&et(h),g}let St=[[/\b(flame|fire|ember|glow|bulb|neon|lit|lamp ?light|led)\b/,{kind:"emissive",finish:"glow"}],[/\b(screen|display|monitor face)\b/,{kind:"glass",finish:"clear"}],[/\b(window|pane|glass|bottle|lens|visor|windscreen)\b/,{kind:"glass",finish:"clear"}],[/\b(snow|frost|ice)\b/,{kind:"snow",finish:"powder"}],[/\b(leaf|leaves|petal|grass|moss|stem|vine|foliage|frond|needles?|blossom|bloom|flower)\b/,{kind:"foliage",finish:"leaf"}],[/\b(soil|dirt|sand|gravel|mud|earth|ground|ash)\b/,{kind:"soil",finish:"dry"}],[/\b(stone|rock|concrete|brick|slate|marble|granite|cobble|plinth|masonry|mortar|cement)\b/,{kind:"stone",finish:"rough"}],[/\b(skin|face|hand|arm|leg flesh|brow|cheek|neck)\b/,{kind:"skin",finish:"natural"}],[/\b(denim|jeans)\b/,{kind:"fabric",finish:"denim"}],[/\b(shirt|blouse|dress|skirt|trousers|pants|briefs|bra|sock|cuff|collar|waistband|sleeve|apron|robe|tunic|cloak|scarf|hat band)\b/,{kind:"fabric",finish:"cotton"}],[/\b(jumper|sweater|knit|beanie)\b/,{kind:"fabric",finish:"knit"}],[/\b(sole|tread|tyre|tire)\b/,{kind:"rubber",finish:"black"}],[/\b(paper|book|page|card|cardboard|label|poster|parchment)\b/,{kind:"paper",finish:"plain"}],[/\b(plastic|vinyl|resin|acrylic|bakelite)\b/,{kind:"plastic",finish:"satin"}],[/\b(eye|pupil|iris|lens|glass|glaze|porcelain|ceramic|enamel)\b/,{kind:"ceramic",finish:"glazed"}],[/\b(hoof|hooves|claw|talon|horn|antler|beak|bill|nail|tusk|tooth|teeth|shell|carapace)\b/,{kind:"keratin",finish:"natural"}],[/\b(mane|tail|hair|feather|beard|whisker|brush)\b/,{kind:"fur",finish:"long"}],[/\b(nose|snout|muzzle pad|tongue|lid|lip|pad|skin|inner ear|inner)\b/,{kind:"leather",finish:"grain"}],[/\b(fur|coat|hide|pelt|fleece|wool(?!len)|points|blaze|belly|bib|cream|markings?|flank|sock|cape|ruff|mask)\b/,{kind:"fur",finish:"short"}],[/\b(brass|bronze|copper|gold|steel|iron|chrome|alumin|metal|tin|zinc|rod|rail|bolt|rivet|chain|wire)\b/,{kind:"metal",finish:"brushed"}],[/\b(oak|walnut|ash|pine|timber|wood|plank|board|beam|bamboo|plywood)\b/,{kind:"wood",finish:"oiled"}],[/\b(leather|saddle|strap|harness|belt|boot)\b/,{kind:"leather",finish:"grain"}],[/\b(linen|wool|cotton|canvas|fabric|cloth|cushion|upholster|sail|rug|blanket|curtain|towel|rope|cord)\b/,{kind:"fabric",finish:"linen"}],[/\b(rubber|tyre|tire|gasket)\b/,{kind:"rubber",finish:"black"}],[/\b(tile|sink|basin|bath|toilet|crockery|mug|plate)\b/,{kind:"ceramic",finish:"glazed"}]];function kt(h={}){let u={};for(let[p,f]of Object.entries(h)){if(!f||f.type!=="color")continue;let g=`${p} ${f.label||""} ${f.describe||""}`.toLowerCase().replace(/_/g," "),M=`${p} ${f.label||""}`.toLowerCase(),w=null;for(let[S,x]of St)if(S.test(M)){w=x;break}if(!w){for(let[S,x]of St)if(S.test(g)){w=x;break}}u[p]={...w||{kind:"paint",finish:"matte"},guessed:!0}}return u}let Jt={fur:1,skin:.6,foliage:.8,soil:1,snow:1},ie={ofSize:.022,min:.003,max:.045};function de(h,u,p,f){let g=h.attributes.position,M=g.count,w=M/3;if(p.filter(C=>C>0).length<2)return null;let S=new Uint32Array(M),x=new Map;for(let C=0;C<M;C++){let L=`${Math.round(g.getX(C)*1e4)},${Math.round(g.getY(C)*1e4)},${Math.round(g.getZ(C)*1e4)}`,P=x.get(L);P===void 0&&(P=x.size,x.set(L,P)),S[C]=P}let E=new Map;for(let C=0;C<w;C++){let L=u[C];if(p[L]>0)for(let P=0;P<3;P++){let O=C*3+P,H=C*3+(P+1)%3,Y=S[O],k=S[H],W=Y<k?Y*4294967296+k:k*4294967296+Y,V=E.get(W);V||(V={i0:O,i1:H,zones:[],room:1/0},E.set(W,V)),V.zones.includes(L)||V.zones.push(L);let G=C*3+(P+2)%3,Q=g.getX(H)-g.getX(O),it=g.getY(H)-g.getY(O),yt=g.getZ(H)-g.getZ(O),bt=g.getX(G)-g.getX(O),Rt=g.getY(G)-g.getY(O),mt=g.getZ(G)-g.getZ(O),st=it*mt-yt*Rt,j=yt*bt-Q*mt,nt=Q*Rt-it*bt,pt=Math.sqrt(st*st+j*j+nt*nt)/(Math.sqrt(Q*Q+it*it+yt*yt)||1e-9);pt<V.room&&(V.room=pt)}}let v=new Map;for(let C of E.values()){if(C.zones.length<2)continue;let L={ax:g.getX(C.i0),ay:g.getY(C.i0),az:g.getZ(C.i0),bx:g.getX(C.i1),by:g.getY(C.i1),bz:g.getZ(C.i1)};for(let P of C.zones){let O=C.zones.find(Y=>Y!==P);v.has(P)||v.set(P,[]);let H=Math.max(1e-4,Math.min(f,C.room*.5));v.get(P).push({...L,other:O,gain:Math.min(p[P],p[O]),scale:f/H})}}if(!v.size)return null;let T=new Float32Array(M*3),R=new Map;for(let C=0;C<M;C++){let L=u[C/3|0],P=v.get(L);if(!P){T[C*3]=1e3,T[C*3+1]=L;continue}let O=S[C]*64+L,H=R.get(O);if(!H){let Y=g.getX(C),k=g.getY(C),W=g.getZ(C),V=1/0,G=L,Q=0;for(let it of P){let yt=it.bx-it.ax,bt=it.by-it.ay,Rt=it.bz-it.az,mt=yt*yt+bt*bt+Rt*Rt||1e-12,st=((Y-it.ax)*yt+(k-it.ay)*bt+(W-it.az)*Rt)/mt;st=st<0?0:st>1?1:st;let j=Y-(it.ax+yt*st),nt=k-(it.ay+bt*st),pt=W-(it.az+Rt*st),ht=(j*j+nt*nt+pt*pt)*it.scale*it.scale;ht<V&&(V=ht,G=it.other,Q=it.gain)}H=[Math.sqrt(V),G,Q],R.set(O,H)}T[C*3]=H[0],T[C*3+1]=H[1],T[C*3+2]=H[2]}return T}function Je(h,u){h.defines={...h.defines||{},PF_BLEND_ZONES:u.count},h.customProgramCacheKey=()=>`pf-blend-${u.count}`,h.onBeforeCompile=p=>{p.uniforms.uPfZone=u.zone,p.uniforms.uPfBand=u.band,p.vertexShader=p.vertexShader.replace("#include <common>",`#include <common>
attribute vec3 aPfBlend;
uniform vec3 uPfZone[PF_BLEND_ZONES];
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_vertex>",`#include <color_vertex>
vPfOther = uPfZone[int(aPfBlend.y + 0.5)];
vPfBlend = aPfBlend.xz;`),p.fragmentShader=p.fragmentShader.replace("#include <common>",`#include <common>
uniform float uPfBand;
varying vec3 vPfOther;
varying vec2 vPfBlend;`).replace("#include <color_fragment>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
  { float pfT = 0.5 * vPfBlend.y * ( 1.0 - smoothstep( 0.0, uPfBand, vPfBlend.x ) );
    diffuseColor.rgb *= mix( vColor.rgb, vPfOther, pfT );
    #ifdef USE_COLOR_ALPHA
      diffuseColor.a *= vColor.a;
    #endif
  }
#endif`)},h.onBeforeRender=(p,f,g,M)=>{let w=p.info.render.frame;if(u.frame===w&&u.geo===M)return;u.frame=w,u.geo=M;let S=M.attributes.color;if(S)for(let x=0;x<u.count;x++){let E=u.rep[x];E>=0&&u.zone.value[x].set(S.getX(E),S.getY(E),S.getZ(E))}},h.needsUpdate=!0}function $e(h,u={},p={},{force:f=!1,smooth:g="auto",blend:M="auto"}={}){let w=Object.keys(u).filter(E=>p[E]);if(!w.length)return 0;let S=w.map(E=>new ut(u[E])),x=0;return h.traverse(E=>{if(!E.isMesh||!E.geometry||Array.isArray(E.material))return;let v=E.material;if(!v||!v.vertexColors||!f&&v.map)return;let T=E.geometry;T.index&&(T=T.toNonIndexed(),E.geometry.dispose(),E.geometry=T);let R=T.attributes.color,C=T.attributes.position;if(!R||!C)return;let L=C.count/3;T.computeBoundingBox();let P=T.boundingBox,O=P.max.z-P.min.z>P.max.x-P.min.x?"z":"x",H=Math.max(P.max.x-P.min.x,P.max.y-P.min.y,P.max.z-P.min.z)||1,Y=j=>Math.max(j.bodyClamp[0],Math.min(j.bodyClamp[1],H/j.body)),k=new Uint8Array(L),W=new Array(w.length).fill(0);for(let j=0;j<L;j++){let nt=0,pt=0,gt=0;for(let Ft=0;Ft<3;Ft++)nt+=R.getX(j*3+Ft),pt+=R.getY(j*3+Ft),gt+=R.getZ(j*3+Ft);nt/=3,pt/=3,gt/=3;let ht=0,Pt=1/0;for(let Ft=0;Ft<S.length;Ft++){let ge=S[Ft],_e=(ge.r-nt)**2+(ge.g-pt)**2+(ge.b-gt)**2;_e<Pt&&(Pt=_e,ht=Ft)}k[j]=ht,W[ht]++}let V=new Uint32Array(L*3),G=[],Q=0;for(let j=0;j<w.length;j++)G.push(Q),Q+=W[j]*3;let it=G.slice(),yt=new Float32Array(C.count*2);for(let j=0;j<L;j++){let nt=k[j],pt=G[nt];V[pt]=j*3,V[pt+1]=j*3+1,V[pt+2]=j*3+2,G[nt]+=3;let gt=p[w[nt]],ht=t[gt.kind]||t.paint;lt(T,yt,j*3,3,gt.tile??((ht.finishes[gt.finish]||{}).tile??ht.tile)*(ht.body?Y(ht):1),gt.grain??O)}T.setAttribute("uv",new Ot(yt,2));let bt=g==="auto"?E.isSkinnedMesh?55:35:g;bt&&vt(T,bt);let Rt=M==="auto"||M===!0?1:Math.max(0,Math.min(4,Number(M)||0)),mt=null;if(Rt>0){let j=w.map(ht=>Math.max(0,Math.min(1,Number(p[ht].blend??Jt[p[ht].kind]??0)))),nt=new A;P.getSize(nt);let pt=Math.max(ie.min,Math.min(ie.max,nt.length()*ie.ofSize))*Rt,gt=de(T,k,j,pt);if(gt){T.setAttribute("aPfBlend",new Ot(gt,3));let ht=w.map(()=>-1);for(let Pt=0;Pt<L;Pt++)ht[k[Pt]]<0&&(ht[k[Pt]]=Pt*3);mt={count:w.length,rep:ht,band:{value:pt},zone:{value:w.map(Pt=>new A().setFromColor(new ut(u[Pt])))},frame:-1,geo:null},T.userData.blendBand=pt}}T.setIndex(new Ot(V,1)),T.clearGroups();let st=[];for(let j=0;j<w.length;j++){if(!W[j])continue;T.addGroup(it[j],W[j]*3,st.length);let nt=q(p[w[j]],"#ffffff",w[j]);nt.vertexColors=!0,nt.flatShading=bt?!1:!!v.flatShading,nt.sheen&&(nt.sheenColor=new ut(u[w[j]]).lerp(new ut("#ffffff"),nt.userData.sheenWhite??.5)),nt.userData.emits&&(nt.emissive=new ut(u[w[j]])),v.side!==void 0&&(nt.side=v.side),mt&&Je(nt,mt),st.push(nt)}E.material=st,x++}),x}function ce(h,u,p=18,f=!1){let g=f?[...h,h[0]]:h,M=g.length,w=[];for(let T=0;T<M;T++){let R=f?g[(T-1+M-1)%(M-1)]:g[Math.max(0,T-1)],C=f?g[(T+1)%(M-1)]:g[Math.min(M-1,T+1)];w.push(new A().subVectors(C,R).normalize())}let S=new A(1,0,0);Math.abs(S.dot(w[0]))>.9&&S.set(0,1,0);let x=[];for(let T=0;T<M;T++){let R=w[T];S=S.clone().addScaledVector(R,-S.dot(R)).normalize();let C=new A().crossVectors(R,S).normalize(),L=[];for(let P=0;P<p;P++){let O=(P+.5)/p*Math.PI*2,H=g[T].clone().addScaledVector(S,Math.cos(O)*u).addScaledVector(C,Math.sin(O)*u);L.push([H.x,H.y,H.z])}x.push(L)}f&&(x[M-1]=x[0]);let E=[],v=(T,R,C)=>E.push(T[0],T[1],T[2],R[0],R[1],R[2],C[0],C[1],C[2]);for(let T=0;T<M-1;T++){let R=x[T],C=x[T+1];for(let L=0;L<p;L++){let P=(L+1)%p;v(R[L],R[P],C[P]),v(R[L],C[P],C[L])}}return E}function pe(h,u,p=10){return ce(h.map(f=>new A(f[0],f[1],f[2])),u,p,!0)}function me(h,u=24,p=0,f=0){let g=h.map(([x,E])=>{let v=[];for(let T=0;T<u;T++){let R=(T+.5)/u*Math.PI*2;v.push([p+Math.cos(R)*x,E,f+Math.sin(R)*x])}return v}),M=[],w=(x,E,v)=>M.push(x[0],x[1],x[2],E[0],E[1],E[2],v[0],v[1],v[2]);for(let x=0;x<g.length-1;x++){let E=g[x],v=g[x+1];for(let T=0;T<u;T++){let R=(T+1)%u;w(E[T],E[R],v[R]),w(E[T],v[R],v[T])}}let S=(x,E,v)=>{let T=[p,E,f];for(let R=0;R<u;R++){let C=(R+1)%u;v?w(T,x[C],x[R]):w(T,x[R],x[C])}};return h[0][0]>0&&S(g[0],h[0][1],!1),h[h.length-1][0]>0&&S(g[g.length-1],h[h.length-1][1],!0),M}function ke(h,u,p,f,g,M,w=.002){let S=new kn(h,u,p,1,1,1).translate(f,g,M),x=h/2,E=p/2,v=[[x,E-w],[x-w,E],[-x+w,E],[-x,E-w],[-x,-E+w],[-x+w,-E],[x-w,-E],[x,-E+w]],T=[],R=(H,Y,k)=>T.push(H[0],H[1],H[2],Y[0],Y[1],Y[2],k[0],k[1],k[2]),C=g-u/2,L=g+u/2,P=v.length;for(let H=0;H<P;H++){let Y=(H+1)%P,k=[f+v[H][0],C,M+v[H][1]],W=[f+v[Y][0],C,M+v[Y][1]],V=[f+v[Y][0],L,M+v[Y][1]],G=[f+v[H][0],L,M+v[H][1]];R(k,W,V),R(k,V,G),R([f,L,M],G,V),R([f,C,M],W,k)}S.dispose();let O=new le;return O.setAttribute("position",new Wt(T,3)),O}function Re(h,u,p,f){let g=[];for(let M=0;M<=f;M++){let w=u+(p-u)*M/f;g.push([h*Math.cos(w),h*Math.sin(w)])}return g}function Ke(h){let u=new le;return u.setAttribute("position",new Wt(h,3)),u}function Qe(h){let u=(Math.imul(h|0,2654435761)^2654435769)>>>0||1;return()=>(u^=u<<13,u>>>=0,u^=u>>>17,u^=u<<5,u>>>=0,u/4294967296)}let jt=[.84,.92,1,1.07,1.14],Ve=(h,u)=>{let p=2*h()-1,f=2*Math.PI*h(),g=Math.sqrt(Math.max(0,1-p*p));return u.set(g*Math.cos(f),p,g*Math.sin(f))},vn=(h,u)=>{let p=Ve(u,new A);return p.addScaledVector(h,-p.dot(h)),p.lengthSq()<1e-6&&p.set(0,1,0).addScaledVector(h,-h.y),p.normalize()};class Xn{constructor(){this.P=jt.map(()=>[]),this.U=jt.map(()=>[])}add(u,p,f,g,M,w,S=!1,x=0){let E=new A().crossVectors(f,p);E.lengthSq()<1e-8&&E.set(1,0,0).cross(p),E.normalize();let v=new A().crossVectors(p,E).normalize(),T=this.P[w],R=this.U[w],C=S?1:0,L=S?0:1,P=(H,Y,k,W,V)=>{let G=(Q,it)=>T.push(u.x+E.x*Q*g+H.x*it*M,u.y+E.y*Q*g+H.y*it*M,u.z+E.z*Q*g+H.z*it*M);G(-1,W),G(1,W),G(1,V),G(-1,W),G(1,V),G(-1,V),R.push(C,Y,L,Y,L,k,C,Y,L,k,C,k)};if(!(x>0)){P(v,0,1,-1,1);return}let O=x*Math.PI/360;P(v.clone().applyAxisAngle(E,O),0,.5,-1,0),P(v.clone().applyAxisAngle(E,-O),.5,1,0,1)}parts(u){let p=[];return jt.forEach((f,g)=>{if(!this.P[g].length)return;let M=Ke(this.P[g]);M.setAttribute("uv",new Wt(this.U[g],2)),p.push({g:M,zone:u,uv:"own",tone:f})}),p}}function qn(h,u,p,f,g=.76,M=.12){let w=new Vn(1,2),S=w.attributes.position,x=new A;for(let E=0;E<S.count;E++){x.fromBufferAttribute(S,E);let v=g*(1+M*(d(x.x*1.7+9,x.y*1.7+9,x.z*1.7+9,p,2)*2-1));S.setXYZ(E,h.x+x.x*u.x*v,h.y+x.y*u.y*v,h.z+x.z*u.z*v)}return w.deleteAttribute("normal"),w.deleteAttribute("uv"),{g:w,zone:f,tone:.3}}function K({lobes:h=[],zone:u="leaf",core:p="leafCore",card:f=.4,density:g=1,seed:M=1,spread:w=.5,inner:S=.5,fold:x=0,facing:E="shell"}={}){let v=Qe(M*7919+1),T=new Xn,R=[],C=h.map(W=>({C:new A().fromArray(W.c),r:Array.isArray(W.r)?new A().fromArray(W.r):new A(W.r,W.r,W.r)})),L=new A,P=new A,O=new A,H=new A,Y=new A,k=(W,V)=>C.some((G,Q)=>Q!==V&&Math.hypot((W.x-G.C.x)/G.r.x,(W.y-G.C.y)/G.r.y,(W.z-G.C.z)/G.r.z)<.82);return C.forEach(({C:W,r:V},G)=>{let it=4*Math.PI*Math.pow((Math.pow(V.x*V.y,1.6)+Math.pow(V.x*V.z,1.6)+Math.pow(V.y*V.z,1.6))/3,.625),yt=Math.max(12,Math.round(g*3.8*(E==="radial"?1.7:1)*it/(f*f))),bt=Math.round(yt*(1+S));for(let Rt=0;Rt<bt;Rt++){let mt=Rt<yt;Ve(v,L);let st=mt?.8+.14*v():.55+.25*v();if(O.set(W.x+L.x*V.x*st,W.y+L.y*V.y*st,W.z+L.z*V.z*st),k(O,G))continue;let j=f*.5*(.8+.4*v()),nt=j*(.85+.3*v()),pt=Math.floor(v()*jt.length);if(P.set(L.x/V.x,L.y/V.y,L.z/V.z).normalize(),E==="radial"&&mt){let gt=P.clone();vn(gt,v).normalize();let ht=vn(gt,v);Y.crossVectors(ht,gt),O.addScaledVector(gt,-j*.25),T.add(O.clone(),ht,Y.clone(),j,nt,pt,v()<.5,x)}else mt?P.lerp(Ve(v,H),w).normalize():Ve(v,P),T.add(O.clone(),P.clone(),vn(P,v),j,nt,pt,v()<.5,x)}p&&p!=="none"&&R.push(qn(W,V,M+G*13,p))}),R.concat(T.parts(u))}function F({base:h=[0,0,0],rims:u=null,bottom:p=.6,top:f=6,radius:g=1.4,tiers:M=5,taper:w=.08,zone:S="leaf",core:x="leafCore",card:E=.5,density:v=1,seed:T=1,droop:R=25,whorl:C=.35,branches:L=9,trunk:P=.05,step:O=.3,lip:H=0,segs:Y=12}={}){let k=Qe(T*104729+3),W=new Xn,V=[],G;if(Array.isArray(u)&&u.length)G=u.map(_t=>({y:+_t.y,r:+_t.r})).sort((_t,Et)=>_t.y-Et.y);else{let _t=Math.max(.1,f-p),Et=_t/(M+.6);G=[];for(let he=0;he<M;he++){let se=p+he*Et;G.push({y:se,r:g*(1-(se-p)/_t*(1-w))})}}let Q=Math.max(f,G[G.length-1].y+.3),it=G[0].y,yt=Q-it,bt=_t=>{if(_t<=G[0].y)return G[0].r;for(let Et=0;Et<G.length;Et++){let he=Et+1<G.length?G[Et+1].y:Q;if(_t<=he){let se=(_t-G[Et].y)/Math.max(1e-6,he-G[Et].y);return Et+1<G.length?G[Et].r*(1-O*se):G[Et].r*Math.max(.05,1-(1-w)*se)}}return .05*G[G.length-1].r},Rt=_t=>Math.max(.012,P*(1-.8*(_t-it)/yt)),mt=new A,st=new A,j=new A,nt=new A,pt=new A,gt=new A,ht=new A,Pt=(_t,Et,he,se)=>{let te=new A().subVectors(Et,_t);if(te.length()<1e-4)return;te.normalize();let tn=new A(-te.z,0,te.x).normalize(),ue=new A().crossVectors(te,tn).normalize(),Zn=(Lt,zt)=>[30,150,270].map(en=>{let fe=en*Math.PI/180;return[Lt.x+(tn.x*Math.cos(fe)+ue.x*Math.sin(fe))*zt,Lt.y+(tn.y*Math.cos(fe)+ue.y*Math.sin(fe))*zt,Lt.z+(tn.z*Math.cos(fe)+ue.z*Math.sin(fe))*zt]}),Sn=Zn(_t,he),Ce=Zn(Et,se);for(let Lt=0;Lt<3;Lt++){let zt=(Lt+1)%3;V.push(...Sn[Lt],...Ce[Lt],...Ce[zt],...Sn[Lt],...Ce[zt],...Sn[zt])}},Ft=[];for(let _t=it,Et=0;_t<Q-.06*yt;Et++)Ft.push(_t),_t+=C*(.85+.3*k());let ge=Ft.length;Ft.forEach((_t,Et)=>{let he=bt(_t),se=Rt(_t),te=(_t-it)/yt,Yn=Math.max(3,Math.round(L*v*(.45+.55*(1-te)))),tn=te>.85,ue=E*(1-.45*te),Zn=R*(1-.4*te),Sn=k()*Math.PI*2;for(let Ce=0;Ce<Yn;Ce++){if(k()<.08)continue;let Lt=Sn+(Ce+.5)/Yn*Math.PI*2+(k()-.5)*.5*Math.PI*2/Yn,zt=Math.max(.5*ue,(he*(1+H)-se)*(.85+.3*k())),en=((tn?-15:Zn)+16*(k()-.5))*Math.PI/180,fe=en-(22+12*k())*Math.PI/180;gt.set(-Math.sin(Lt),0,Math.cos(Lt));let Jn=new A(h[0]+Math.cos(Lt)*se*.6,_t,h[2]+Math.sin(Lt)*se*.6),bn=Jn.clone().add(new A(Math.cos(Lt)*Math.cos(en),-Math.sin(en),Math.sin(Lt)*Math.cos(en)).multiplyScalar(.55*zt)),$s=bn.clone().add(new A(Math.cos(Lt)*Math.cos(fe),-Math.sin(fe),Math.sin(Lt)*Math.cos(fe)).multiplyScalar(.45*zt)),$n=.014+.044*Math.pow(1-te,1.3)*Math.min(1,zt/1.5);Pt(Jn,bn,$n,.55*$n),Pt(bn,$s,.55*$n,.12*$n);let Ac=Math.max(2,Math.round(v*zt/(.5*E))),Gi=Math.floor(k()*jt.length),Wr=new A(0,1,0),nn=new A,Wi=new A,Xi=(sn,qt,He,wn,Tn,qi,Yi=He*.75)=>{Wi.set(-qt.z,0,qt.x).normalize(),st.copy(sn).addScaledVector(qt,Yi),j.crossVectors(qt,Wi).normalize().applyAxisAngle(qt,1.8*(k()-.5)),W.add(st.clone(),j.clone(),pt.crossVectors(j,qt).clone(),He,wn,Tn,k()<.5),qi&&(nt.copy(Wi).applyAxisAngle(qt,.6*(k()-.5)),W.add(st.clone(),nt.clone(),pt.crossVectors(nt,qt).clone(),He,wn*.9,Tn,k()<.5))};(Ce%2===0||te>.6)&&(nn.copy(new A(Math.cos(Lt),1.4,Math.sin(Lt))).normalize(),Xi(Jn,nn,ue*.4,ue*.4,Gi,!0));let En=.08*zt;for(let sn=0;En<zt&&sn<12;sn++){let qt=En/zt,He=qt>.55,wn=He?bn:Jn,Tn=He?$s:bn,qi=He?(qt-.55)/.45:qt/.55;ht.lerpVectors(wn,Tn,Math.min(1,qi)),mt.subVectors(Tn,wn).normalize();let Yi=(8+10*k())*Math.PI/180;mt.applyAxisAngle(gt,-Yi*Math.sign(gt.x*mt.z-gt.z*mt.x||1)).normalize();let Ks=1.15-.7*Math.min(1,qt),Ge=ue*.5*(.85+.35*k())*Ks,Zi=En+1.9*Ge>=zt;Zi&&(Ge=Math.max(.3*ue*.5,Math.min(Ge,(zt-En)/1.4)));let Qs=ue*.5*Ks*(Zi?.7:1);if(Xi(ht,mt,Ge,Qs,(Gi+sn)%jt.length,!0,Ge*.7),qt>.45&&!Zi)for(let Xr of[1,-1])nn.copy(mt).applyAxisAngle(Wr,Xr*(.5+.25*k())).normalize(),nn.y-=.18+.1*k(),nn.normalize(),Xi(ht,nn,Ge*.8,Qs*.85,(Gi+sn+2)%jt.length,!1);En+=1.5*Ge}}});let _e=Q-.3*E,je=.35*E,xe=.35*E;for(let _t=0;_t<3;_t++){let Et=_t*Math.PI/3;W.add(new A(h[0],_e,h[2]),new A(Math.cos(Et),0,Math.sin(Et)),new A(-Math.sin(Et),0,Math.cos(Et)),je,xe,Math.floor(k()*jt.length),!1)}let Mn=W.parts(S);return V.length&&Mn.push({g:Ke(V),zone:x,tone:.32}),Mn}return{HD_ENV:_,KINDS:t,MATERIAL_FIELDS:e,HD_BUDGET:n,hdTriBudget:i,noise3:c,fbm3:d,finishShapesPattern:D,mapsFor:U,materialFor:q,animate:tt,fireBounds:et,boxUV:ot,boxUVInto:lt,smoothByAngle:vt,wrinkle:ct,assemble:It,keepSeeThrough:xt,dress:At,guessMaterials:kt,dressByAlbedo:$e,sweepTubePositions:ce,weltPositions:pe,lathePositions:me,chamferedBox:ke,arc:Re,posGeo:Ke,canopy:K,conifer:F}})(),kr=(()=>{let{assemble:_,posGeo:t}=yc,e="hd",n=Math.PI*2,i={"warm-clay":{ceramic:"#D2B084",linen:"#FAF8F3",lining:"#F3EEE8",brass:"#C9A24B"},"chalk-taupe":{ceramic:"#B4AAA0",linen:"#F8F4EF",lining:"#ECE7E0",brass:"#C9A24B"},"walnut-cream":{ceramic:"#6B4A32",linen:"#F3EEE8",lining:"#CFC3B0",brass:"#E0C078"},"sage-accent":{ceramic:"#7E9179",linen:"#FAF8F3",lining:"#F3EEE8",brass:"#C9A24B"}},s=i,r={ceramic:{kind:"ceramic",finish:"matte",crease:48,describe:"turned stoneware body, unglazed matte: round plinth foot with a rolled shoulder, lower gourd and upper gourd, a parting cove turned at each joint"},linen:{kind:"fabric",finish:"linen",describe:"linen skin of the drum shade, weave running up the shade, bound with a tape of the same linen at top and bottom and seamed in four panels"},lining:{kind:"fabric",finish:"linen",describe:"the paper-backed linen lining inside the shade; it takes the emissive glow only when the lamp is lit"},brass:{kind:"metal",finish:"polished",crease:65,describe:"polished brass: turned ferrule collar, stem, four-arm cross spider of wire and its plain hub"}},o={kind:"emissive",finish:"glow",intensity:.55,describe:"the lining with the bulb on behind it"},a={colorway:{type:"choice",default:"warm-clay",label:"Colorway",options:Object.keys(i),describe:"Curated kit-coherent schemes. warm-clay is the default tan ceramic under off-white linen; chalk-taupe is a cool grey-beige glaze; walnut-cream is a dark stained body against cream linen (the strongest value contrast); sage-accent spends the room's one accent colour on the ceramic. Sets ceramic, linen, lining and brass."},ceramic:{type:"color",default:i["warm-clay"].ceramic,label:"Ceramic",describe:"Albedo of the whole turned body: round foot, lower gourd and upper gourd. Matte, unglazed, one flat tone across every facet."},linen:{type:"color",default:i["warm-clay"].linen,label:"Shade linen",describe:"Albedo of the OUTSIDE of the drum shade. Keep it the brightest mass on the lamp: it is the shape that reads from across a room."},lining:{type:"color",default:i["warm-clay"].lining,label:"Shade lining",describe:"Albedo of the INSIDE of the shade, seen through the open top and up from below. Its own zone because it is what lights up after dark \u2014 hold it one clear value rung under the outer linen so the rim reads as a real thickness."},brass:{type:"color",default:i["warm-clay"].brass,label:"Brass fitting",describe:"Albedo of the ferrule collar on top of the body, the stem, the three-arm spider and the finial. Small warm hardware accent; never near-black."},bodyShape:{type:"range",default:.5,min:0,max:1,step:.05,label:"Body shape",affects:"geometry",describe:"Rebuilds the turned profile of the ceramic body. 0 is a tall slim gourd: a narrow lower ball (172mm across) carrying a pronounced round knob above a deep pinch. 1 is a squat potted gourd: a fat lower ball (232mm across) sitting low, with the pinch dropped and the upper section drawn out as a slimmer column. The overall height and the shade are unchanged at every value, so only the body silhouette moves."},shadeTaper:{type:"range",default:.55,min:0,max:1,step:.05,label:"Shade taper",affects:"geometry",describe:"How much narrower the top of the shade is than its bottom. 0 is a dead straight drum (top and bottom both 256mm across); 1 is a steep empire cone (top 159mm). The default 0.55 is the classic slight taper in the reference. The bottom rim never moves, so the lamp keeps its footprint at every value."},lived_in:{type:"range",default:.35,min:0,max:1,step:.05,label:"Lived in",affects:"geometry",describe:"The kit-wide showroom-to-used axis, spent on GEOMETRY. 0 is showroom: the shade sits dead square on its spider with a true circular rim. 1 is a lamp that has been knocked past for years: the shade is tipped 8 degrees off plumb on its fitting (it pivots at the spider, so it stays properly seated on the stem) and both sides of the bottom rim have gone soft, dropping 12mm and flaring out where the linen has lost its shape. Both changes are in the vertices and read in the silhouette."},lit:{type:"toggle",default:!1,label:"Lit",describe:"Switches the shade to its LIT tone: the linen warms and the lining goes a deep amber, as when the bulb is on behind it. Default false, so the shipped daytime albedo carries no baked glow. This is the flat-albedo version for consumers that never read the schema; the real night data is in `export const night`, which holds the same two zones unlit while the scene goes dark."}},l={},c=[],d={lining:{color:"#FFD9A0",intensity:1,describe:"bulb behind the shade \u2014 the inside of the drum burns warm"},linen:{color:"#FFD9A0",intensity:.55,describe:"linen going translucent-warm from the bulb inside it"}},m=[],y=32,b=6,I=6,N=6,B=.248,D=.242,z=.268,U=.276,q=.445,J=.128*Math.cos(Math.PI/12),$=.006,X=.01,tt=.0025,et=.002,rt=.428,ot=rt,lt=.007,vt=8*Math.PI/180,ct=[1,.4,0,0,.4,1,.4,0,0,0,0,.4];function Dt(K){let F=(K-Math.PI/12)/(Math.PI/6);F=(F%12+12)%12;let h=Math.floor(F),u=F-h,p=(1-Math.cos(Math.PI*u))/2;return ct[h%12]*(1-p)+ct[(h+1)%12]*p}function Mt(K,F,h,u){K.push(F[0],F[1],F[2],h[0],h[1],h[2],u[0],u[1],u[2])}function It(K,F,h,u,p,f){let g=h[0]-F[0],M=h[1]-F[1],w=h[2]-F[2],S=u[0]-F[0],x=u[1]-F[1],E=u[2]-F[2],v=M*E-w*x,T=w*S-g*E,R=g*x-M*S,C=[(F[0]+u[0])/2,(F[1]+u[1])/2,(F[2]+u[2])/2],L=typeof f=="function"?f(C):f;v*L[0]+T*L[1]+R*L[2]>=0?(Mt(K,F,h,u),Mt(K,F,u,p)):(Mt(K,F,u,h),Mt(K,F,p,u))}let xt=K=>[K[0],0,K[2]],At=K=>[-K[0],0,-K[2]];function St(K,F,h,u){let p=F.length;for(let f=0;f<p;f++){let g=(f+1)%p;It(K,F[f],h[f],h[g],F[g],u)}}function kt(K,F,h,u){let p=[];for(let f=0;f<K;f++){let g=F+f/K*n;p.push([h*Math.cos(g),u,h*Math.sin(g)])}return p}function Jt(K,F,{phase:h=0,capBottom:u=!1,capTop:p=!1}={}){let f=[],g=K.map(([S,x])=>kt(F,h,S,x)),M=(S,x,E)=>{for(let v=0;v<F;v++){let T=(v+1)%F,R=S[v],C=S[T],L=R[0]-x[0],P=R[1]-x[1],O=R[2]-x[2],H=C[0]-x[0],Y=C[1]-x[1],k=C[2]-x[2],W=[P*k-O*Y,O*H-L*k,L*Y-P*H],V=[(R[0]+C[0])/2,0,(R[2]+C[2])/2],G=typeof E=="function"?E(V):E;W[0]*G[0]+W[1]*G[1]+W[2]*G[2]>=0?Mt(f,x,R,C):Mt(f,x,C,R)}},w=K.length-1;for(let S=0;S<w;S++){let[x,E]=K[S],[v,T]=K[S+1];if(x===0){M(g[S+1],[0,E,0],R=>[R[0],.3,R[2]]);continue}if(v===0){M(g[S],[0,T,0],R=>[R[0],.3,R[2]]);continue}St(f,g[S],g[S+1],R=>{let C=Math.hypot(R[0],R[2])||1;return[R[0]/C*(T-E),-(v-x),R[2]/C*(T-E)]})}return u&&K[0][0]>0&&M(g[0],[0,K[0][1],0],[0,-1,0]),p&&K[w][0]>0&&M(g[w],[0,K[w][1],0],[0,1,0]),t(f)}function ie(K,F,h){return"#"+new ut(K).lerp(new ut(F),h).getHexString()}function de(K){let F={};for(let u in a)F[u]=a[u].default;let h=K.colorway!==void 0?K.colorway:F.colorway;i[h]&&Object.assign(F,i[h]),F.colorway=h;for(let u in K)K[u]!==void 0&&(F[u]=K[u]);return F}function Je(K){let F=.086+.03*K,h=.105-.01*K,u=.196-.03*K,p=.028+.004*K,f=.055-.012*K,g=F*.74,M=u-h;return[[g,0],[g*1.02,.007],[g*1.02,.026],[g*.9,.033],[g*.7,.04],[F*.87,.04+(h-.04)*.42],[F,h],[F*.93,h+M*.35],[F*.58,h+M*.72],[p,u],[f*.9,u+.014],[f,u+.031],[f*.86,u+.049],[.024,B]]}let $e=28,ce=26,pe=16,me=8,ke=7,Re=.004;function Ke(K,F,[h,u],[p,f],g){let M=Math.acos(Math.min(1,h/K)),w=Math.acos(Math.min(1,p/K)),S=(F-u)/Math.sin(M),x=(f-F)/Math.sin(w),E=[];for(let v=0;v<=g;v++){let T=-M+(M+w)*v/g;E.push([K*Math.cos(T),F+(T<0?S:x)*Math.sin(T)])}return E}function Qe(K,F,h,u,p){let f=h[0]-F[0],g=h[1]-F[1],M=h[2]-F[2],w=u[0]-F[0],S=u[1]-F[1],x=u[2]-F[2],E=[g*x-M*S,M*w-f*x,f*S-g*w],v=p([(F[0]+h[0]+u[0])/3,0,(F[2]+h[2]+u[2])/3]);E[0]*v[0]+E[1]*v[1]+E[2]*v[2]>=0?Mt(K,F,h,u):Mt(K,F,u,h)}function jt(K,F,{capBottom:h=!1}={}){let u=[],p=Math.PI/F,f=K.map(([g,M,w])=>w?kt(F/2,p+Math.PI/F,g,M):kt(F,p,g,M));for(let g=0;g<f.length-1;g++){let[M,w]=K[g],[S,x]=K[g+1],E=P=>{let O=Math.hypot(P[0],P[2])||1;return[P[0]/O*(x-w),-(S-M),P[2]/O*(x-w)]},v=f[g],T=f[g+1];if(v.length===T.length){St(u,v,T,E);continue}let R=v.length<T.length?v:T,C=v.length<T.length?T:v,L=R.length;for(let P=0;P<L;P++){let O=(P+1)%L;Qe(u,R[P],C[2*P],C[2*P+1],E),Qe(u,R[P],C[2*P+1],R[O],E),Qe(u,R[O],C[2*P+1],C[(2*P+2)%(2*L)],E)}}if(h){let g=f[0],M=K[0][1];for(let w=0;w<g.length;w++)Mt(u,[0,M,0],g[w],g[(w+1)%g.length])}return t(u)}function Ve(K,F,h){let u=kt(K,0,F,h),p=[];for(let f=1;f<K-1;f++)Mt(p,u[0],u[f+1],u[f]);return p}function vn(K){let F=Je(K),h=F[0][0],u=F[6][0],[p,f]=F[9],g=v=>[v[0],v[1],!0],M=[[h*.985,0],[h*1.02,.004],[h*1.02,.025],[h*.96,.0315],[h*.62,.037]],w=Ke(u,F[6][1],[h*.7,.037+Re],[p-.004,f],me),S=[[h*.7,.033],...w.slice(0,-1),g(w[w.length-1])],x=Ke(F[11][0],F[11][1],[p,f+Re],[.015,B+5e-4],ke),E=[[p,f-.004],...x.slice(0,-1),g(x[x.length-1])];return{base:M,lower:S,upper:E}}function Xn(K,F,h,u,p,f){let g=[],M=f*.866,w=[[0,f,0],[-F*M,-f/2,K*M],[F*M,-f/2,-K*M]],S=(x,E)=>[x*K+E[0],p+E[1],x*F+E[2]];for(let x=0;x<3;x++){let E=w[x],v=w[(x+1)%3];It(g,S(h,E),S(u,E),S(u,v),S(h,v),[E[0]+v[0],E[1]+v[1],E[2]+v[2]])}return t(g)}function qn(K={}){let F=de(K),h=Math.min(1,Math.max(0,Number(F.bodyShape))),u=Math.min(1,Math.max(0,Number(F.shadeTaper))),p=Math.min(1,Math.max(0,Number(F.lived_in))),f=Math.pow(p,.8),g={ceramic:F.ceramic,linen:F.lit?ie(F.linen,"#F0C87A",.45):F.linen,lining:F.lit?ie(F.lining,"#F0C87A",.7):F.lining,brass:F.brass},M=F.lit?{...r,lining:o}:r,w=[],S=(st,j,nt=null,pt=1,gt=0)=>w.push({g:st,zone:j,grain:nt,tone:pt,shift:gt}),x=vn(h);S(jt(x.base,$e,{capBottom:!0}),"ceramic","y"),S(jt(x.lower,ce),"ceramic","y"),S(jt(x.upper,pe),"ceramic","y"),S(Jt([[.019,D],[.019,z]],b),"brass","y"),S(t(Ve(b,.019,z)),"brass","x"),S(Jt([[lt,.258],[lt,ot]],I),"brass","y"),S(Jt([[.009,ot-.004],[.009,ot+.004]],N,{capBottom:!0}),"brass","y"),S(t(Ve(N,.009,ot+.004)),"brass","x");let E=Math.cos(Math.PI/12),v=.128*(1-.38*u)*E,T=st=>J+(v-J)*(st-U)/(q-U),R=st=>-.012*f*Dt(st),C=st=>.005*f*Dt(st),L=(st,j,nt)=>{let pt=[];for(let gt=0;gt<y;gt++){let ht=gt/y*n,Pt=T(st)-j+C(ht)*nt;pt.push([Pt*Math.cos(ht),st+R(ht)*nt,Pt*Math.sin(ht)])}return pt},P=L(U+et,-tt,1),O=L(U+X,0,.85),H=L(q-X,0,0),Y=L(q-et,-tt,0),k=L(q,$,0),W=L(U,$,1),V=[],G=(st,j,nt,pt,gt)=>V.push({g:t(st),zone:j,grain:nt,tone:pt,shift:gt}),Q;Q=[],St(Q,O,H,xt),G(Q,"linen","y",1,0),Q=[],St(Q,P,O,xt),G(Q,"linen","x",.88,.41),Q=[],St(Q,H,Y,xt),G(Q,"linen","x",.88,.63),Q=[],St(Q,Y,k,[0,1,0]),G(Q,"linen","x",.9,.2),Q=[],St(Q,W,P,[0,-1,0]),G(Q,"linen","x",.9,.7),Q=[],St(Q,k,W,At),G(Q,"lining","y",1,0),Q=[];for(let st=0;st<4;st++){let j=st*y/4+y/8,nt=j/y*n,pt=-Math.sin(nt),gt=Math.cos(nt),ht=(xe,Mn,_t)=>{let Et=Math.hypot(xe[0],xe[2]);return[xe[0]+pt*Mn+xe[0]/Et*_t,xe[1],xe[2]+gt*Mn+xe[2]/Et*_t]},Pt=O[j],Ft=H[j],ge=.0028,_e=9e-4,je=-6e-4;It(Q,ht(Pt,-ge,je),ht(Pt,0,_e),ht(Ft,0,_e),ht(Ft,-ge,je),xt),It(Q,ht(Pt,0,_e),ht(Pt,ge,je),ht(Ft,ge,je),ht(Ft,0,_e),xt)}G(Q,"linen","y",.96,.5);let it=(ot-U)/(q-U),yt=J+(v-J)*it-$,bt=.004,Rt=yt*Math.cos(Math.PI/y)+.002;for(let st of[45,135,225,315]){let j=st*Math.PI/180,nt=Math.cos(j),pt=Math.sin(j);V.push({g:Xn(nt,pt,bt,Rt,ot,.0026),zone:"brass",grain:[nt,0,pt]})}if(f>0){let st=new Gt().makeTranslation(0,rt,0).multiply(new Gt().makeRotationX(vt*f)).multiply(new Gt().makeTranslation(0,-rt,0));for(let j of V)j.g.applyMatrix4(st)}w.push(...V);let mt=new yn;return mt.name="table-lamp",mt.add(_(w,{name:"lamp",colors:g,materials:M})),mt}return{edition:e,presets:s,materials:r,params:a,rig:l,detach:c,night:d,decals:m,createAsset:qn,default:qn}})(),{createAsset:Vr,decals:Gm,detach:Wm,edition:Xm,materials:qm,night:Ym,params:Hr,presets:Zm,rig:Jm}=kr,$m=kr.default;var Mc=Vr,Sc=Hr||{},Gr=Object.entries(Sc).flatMap(([_,t])=>{if(!t||!["choice","range","integer","toggle","color"].includes(t.type))return[];let e={key:_,kind:t.type,label:t.label||_,hint:t.describe||""};if(t.type==="choice"){if(!Array.isArray(t.options)||!t.options.every(n=>typeof n=="string"))return[];e.options=t.options.map(n=>({value:n,label:n}))}if(t.type==="range"||t.type==="integer"){if(![t.min,t.max,t.step].every(Number.isFinite))return[];Object.assign(e,{min:t.min,max:t.max,step:t.step})}return[{...e,default:t.default}]}),bc={controls:Gr.map(({default:_,...t})=>t)};function Ec(_={}){let t=Object.fromEntries(Gr.map(n=>[n.key,_[n.key]??n.default])),e=Mc(_);return e.userData.design={applied:t},e}function wc(_){_.traverse(t=>{t.geometry?.dispose(),Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material?.dispose()})}return Kr(Tc);})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
