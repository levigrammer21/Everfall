import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut, type User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { restore, type Save } from './save';
const firebaseConfig={
 apiKey:'AIzaSyB6aBWpAFHaLOlMLx3jEwtAMpTKlSWFvRI',authDomain:'everfall-d0cf7.firebaseapp.com',projectId:'everfall-d0cf7',
 storageBucket:'everfall-d0cf7.firebasestorage.app',messagingSenderId:'292690484524',appId:'1:292690484524:web:5f961bc7cdfd02c7f6e089'
};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const ref=(uid:string)=>doc(db,'everfallSaves',uid);
export const authWatch=(callback:(user:User|null)=>void)=>onAuthStateChanged(auth,callback);
export const emailSignIn=(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password);
export const emailRegister=(email:string,password:string)=>createUserWithEmailAndPassword(auth,email,password);
export const google=()=>signInWithPopup(auth,new GoogleAuthProvider());
export const resetPassword=(email:string)=>sendPasswordResetEmail(auth,email);
export const logout=()=>signOut(auth);
export async function loadCloud(uid:string){
 const snap=await getDocFromServer(ref(uid));if(!snap.exists())return null;
 const raw=snap.data();return {rev:Number(raw.revision)||0,save:restore(JSON.parse(raw.payload))};
}
export class SaveConflict extends Error{constructor(){super('A newer save exists on another device.');}}
export function writeCloud(uid:string,s:Save,rev:number,client:string){
 const payload=JSON.stringify(s);
 return runTransaction(db,async t=>{
  const document=await t.get(ref(uid));const old=document.data();const current=Number(old?.revision)||0;
  if(current!==rev){
   if(old?.client===client&&old?.payload===payload)return current;
   throw new SaveConflict();
  }
  t.set(ref(uid),{schema:3,revision:rev+1,payload,client});
  return rev+1;
 });
}
