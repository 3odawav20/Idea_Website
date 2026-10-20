import { useState, type FormEvent } from 'react';
import { accountRequest } from '../backend/accountsApi';
import { Panel, Field, inputStyle } from '../components/dash';
import { Button } from '../components/ui';
import { useMembershipText } from './Membership';

export function AccountSecurity(){
  const t=useMembershipText();
  const [fields,setFields]=useState({current:'',next:'',confirm:''});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[saved,setSaved]=useState(false);
  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(busy)return;setMessage('');setSaved(false);
    if(fields.next!==fields.confirm){setMessage(t('The new passwords do not match.','كلمتا المرور الجديدتان غير متطابقتين.'));return;}
    setBusy(true);
    try{await accountRequest('change-password',{current_password:fields.current,new_password:fields.next});setFields({current:'',next:'',confirm:''});setSaved(true);setMessage(t('Your password was changed. Use the new password the next time you sign in.','تم تغيير كلمة المرور. استخدم الكلمة الجديدة عند تسجيل الدخول مرة أخرى.'));}
    catch(error){const code=error instanceof Error?error.message:'';setMessage(code==='INVALID_CURRENT_PASSWORD'?t('The current password is incorrect.','كلمة المرور الحالية غير صحيحة.'):code==='NEW_PASSWORD_SAME'?t('Choose a different new password.','اختر كلمة مرور جديدة مختلفة.'):t('Could not change the password. Please try again.','تعذر تغيير كلمة المرور. حاول مرة أخرى.'));}
    finally{setBusy(false);}
  };
  return <Panel style={{maxWidth:560}}><h1 className="idea-display" style={{fontSize:'var(--idea-text-xl)',marginBottom:24}}>{t('Change password','تغيير كلمة المرور')}</h1>
    <form onSubmit={submit}>{([['current','Current password','كلمة المرور الحالية'],['next','New password','كلمة المرور الجديدة'],['confirm','Confirm new password','تأكيد كلمة المرور الجديدة']] as const).map(([key,en,ar])=><Field key={key} label={t(en,ar)}><input aria-label={t(en,ar)} type="password" required style={inputStyle} minLength={key==='current'?1:8} maxLength={128} autoComplete={key==='current'?'current-password':'new-password'} value={fields[key]} onChange={event=>setFields({...fields,[key]:event.target.value})}/></Field>)}
    <p>{t('Use at least 8 characters.','استخدم 8 أحرف على الأقل.')}</p><Button type="submit" disabled={busy}>{busy?t('Saving…','جارٍ الحفظ…'):t('Save new password','حفظ كلمة المرور الجديدة')}</Button>
    {message&&<p role={saved?'status':'alert'} style={{marginTop:16,color:saved?'var(--idea-success)':'var(--idea-danger)'}}>{message}</p>}
    </form></Panel>;
}
