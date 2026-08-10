import { useEffect, useState } from 'react'
import { Bell, Bookmark, Compass, Feather, Heart, Home, LogOut, MessageCircle, MoreHorizontal, Repeat2, Search, Settings, UserRound, Users, X } from 'lucide-react'
import { api } from './api'

const avatar = (user) => user?.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user?.username || 'guest')}&backgroundColor=transparent`
const timeAgo = (date) => new Intl.RelativeTimeFormat('pt-BR', {numeric:'auto'}).format(-Math.max(1, Math.round((Date.now()-new Date(date))/3600000)), 'hour')

function Auth({onAuth}) {
  const [register, setRegister] = useState(false), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const form = Object.fromEntries(new FormData(e.currentTarget))
    try { const data = await api(register ? '/auth/register/' : '/auth/login/', {method:'POST', body:JSON.stringify(form)}); onAuth(data) }
    catch (err) { setError(String(err.message)) } finally { setLoading(false) }
  }
  return <main className="auth-page">
    <section className="auth-brand"><div className="brand-mark"><Feather size={42}/></div><p>Converse. Descubra. Conecte.</p><h1>O que está acontecendo agora?</h1><div className="brand-orbit orbit-one"/><div className="brand-orbit orbit-two"/></section>
    <section className="auth-panel"><div className="auth-card"><div className="mobile-logo"><Feather/></div><span className="eyebrow">BEM-VINDO À COMUNIDADE</span><h2>{register ? 'Crie sua conta' : 'Entre na sua conta'}</h2><p className="muted">{register ? 'Leva menos de um minuto.' : 'Veja novidades de quem importa para você.'}</p>
      <form onSubmit={submit}>{register && <><label>Nome</label><input name="display_name" placeholder="Como devemos chamar você?" required/><label>E-mail</label><input name="email" type="email" placeholder="voce@email.com" required/></>}<label>Usuário</label><input name="username" placeholder="seu_usuario" required/><label>Senha</label><input name="password" type="password" placeholder="••••••••" minLength="8" required/>{error && <p className="error">{error}</p>}<button className="primary full" disabled={loading}>{loading ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</button></form>
      <p className="switch">{register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <button onClick={()=>{setRegister(!register);setError('')}}>{register ? 'Entrar' : 'Cadastre-se'}</button></p>
    </div></section>
  </main>
}

function Sidebar({view,setView,user,onLogout}) {
 const items=[[Home,'feed','Início'],[Compass,'explore','Explorar'],[Bell,'notifications','Notificações'],[Users,'people','Pessoas'],[Bookmark,'bookmarks','Salvos'],[UserRound,'profile','Perfil'],[Settings,'settings','Configurações']]
 return <aside className="sidebar"><button className="logo" onClick={()=>setView('feed')}><Feather/></button><nav>{items.map(([Icon,id,label])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon/><span>{label}</span></button>)}</nav><button className="compose-side" onClick={()=>setView('feed')}><Feather/><span>Publicar</span></button><div className="side-user"><img src={avatar(user)}/><div><strong>{user.display_name||user.username}</strong><small>@{user.username}</small></div><button onClick={onLogout} title="Sair"><LogOut size={18}/></button></div></aside>
}

function Composer({user,onCreated}) {
 const [content,setContent]=useState(''),[busy,setBusy]=useState(false)
 async function send(){if(!content.trim())return;setBusy(true);try{const post=await api('/posts/',{method:'POST',body:JSON.stringify({content})});setContent('');onCreated(post)}finally{setBusy(false)}}
 return <div className="composer"><img src={avatar(user)}/><div><textarea value={content} maxLength={280} onChange={e=>setContent(e.target.value)} placeholder="O que está acontecendo?"/><div className="composer-actions"><div className="media-actions"><button title="Foto">▧</button><button title="GIF">GIF</button><button title="Enquete">▤</button><button title="Emoji">☺</button></div><div><span className={content.length>250?'danger':''}>{content.length}/280</span><button className="primary" disabled={busy||!content.trim()} onClick={send}>Publicar</button></div></div></div></div>
}

function Post({post,onChange}) {
 const [comment,setComment]=useState(''),[open,setOpen]=useState(false)
 async function like(){const result=await api(`/posts/${post.id}/like/`,{method:'POST'});onChange({...post,liked_by_me:result.liked,likes_count:result.likes_count})}
 async function reply(e){e.preventDefault();const result=await api(`/posts/${post.id}/comments/`,{method:'POST',body:JSON.stringify({content:comment})});onChange({...post,comments:[...post.comments,result],comments_count:post.comments_count+1});setComment('')}
 return <article className="post"><img className="post-avatar" src={avatar(post.author)}/><div className="post-body"><div className="post-meta"><strong>{post.author.display_name||post.author.username}</strong><span>@{post.author.username} · {timeAgo(post.created_at)}</span><MoreHorizontal size={18}/></div><p>{post.content}</p><div className="post-actions"><button onClick={()=>setOpen(!open)}><MessageCircle/><span>{post.comments_count}</span></button><button><Repeat2/><span>0</span></button><button className={post.liked_by_me?'liked':''} onClick={like}><Heart fill={post.liked_by_me?'currentColor':'none'}/><span>{post.likes_count}</span></button><button><Bookmark/></button></div>{open&&<div className="comments">{post.comments.map(c=><div className="comment" key={c.id}><img src={avatar(c.author)}/><p><strong>{c.author.display_name||c.author.username}</strong> {c.content}</p></div>)}<form onSubmit={reply}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Escreva uma resposta…" required/><button>Responder</button></form></div>}</div></article>
}

function People({user}) {
 const [people,setPeople]=useState([]),[search,setSearch]=useState('')
 useEffect(()=>{api(`/users/${search?`?search=${encodeURIComponent(search)}`:''}`).then(d=>setPeople(d.results||d))},[search])
 async function follow(person){const data=await api(`/users/${person.id}/follow/`,{method:'POST'});setPeople(p=>p.map(x=>x.id===person.id?{...x,is_following:data.following,followers_count:data.followers_count}:x))}
 return <><header className="page-header"><h2>Pessoas</h2></header><div className="search-box"><Search/><input placeholder="Buscar pessoas" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="people-list">{people.filter(p=>p.id!==user.id).map(p=><div className="person" key={p.id}><img src={avatar(p)}/><div><strong>{p.display_name||p.username}</strong><small>@{p.username} · {p.followers_count} seguidores</small><p>{p.bio}</p></div><button className={p.is_following?'outline':'primary'} onClick={()=>follow(p)}>{p.is_following?'Seguindo':'Seguir'}</button></div>)}</div></>
}

function Profile({user,onUpdate}) {
 const [editing,setEditing]=useState(false),[error,setError]=useState('')
 async function save(e){e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));Object.keys(values).forEach(k=>!values[k]&&delete values[k]);try{const updated=await api('/profile/',{method:'PATCH',body:JSON.stringify(values)});onUpdate({...user,...updated});setEditing(false)}catch(err){setError(err.message)}}
 return <><header className="page-header"><div><h2>{user.display_name||user.username}</h2><small>{user.followers_count} seguidores</small></div></header><div className="profile-hero"><div className="cover"/><img src={avatar(user)}/><button className="outline" onClick={()=>setEditing(true)}>Editar perfil</button><h2>{user.display_name||user.username}</h2><span>@{user.username}</span><p>{user.bio||'Conte um pouco sobre você.'}</p><div><strong>{user.following_count}</strong> Seguindo <strong>{user.followers_count}</strong> Seguidores</div></div>{editing&&<div className="modal"><form className="modal-card" onSubmit={save}><button type="button" className="close" onClick={()=>setEditing(false)}><X/></button><h2>Editar perfil</h2><label>Nome</label><input name="display_name" defaultValue={user.display_name}/><label>Bio</label><textarea name="bio" defaultValue={user.bio}/><label>URL da foto</label><input name="avatar_url" defaultValue={user.avatar_url}/><label>Senha atual</label><input name="current_password" type="password"/><label>Nova senha</label><input name="new_password" type="password"/>{error&&<p className="error">{error}</p>}<button className="primary">Salvar alterações</button></form></div>}</>
}

function Rightbar({user,setView}) {return <aside className="rightbar"><div className="search-box"><Search/><input placeholder="Buscar no EBAC Social"/></div><section><h3>O que está acontecendo</h3><div className="trend"><small>Assuntos do momento no Brasil</small><strong>#Tecnologia</strong><span>12,4 mil posts</span></div><div className="trend"><small>Desenvolvimento · Em alta</small><strong>React</strong><span>8.291 posts</span></div><div className="trend"><small>Carreira · Em alta</small><strong>#Programação</strong><span>4.560 posts</span></div></section><section><h3>Encontre sua comunidade</h3><p className="muted">Descubra novas pessoas e ideias.</p><button className="link" onClick={()=>setView('people')}>Ver pessoas</button></section><footer>Termos · Privacidade · Cookies<br/>© 2026 EBAC Social</footer></aside>}

function App(){
 const [token,setToken]=useState(localStorage.getItem('ebac_token')),[user,setUser]=useState(null),[view,setView]=useState('feed'),[posts,setPosts]=useState([]),[error,setError]=useState('')
 useEffect(()=>{if(token)api('/profile/').then(setUser).catch(()=>logout())},[token])
 useEffect(()=>{if(user&&['feed','explore'].includes(view)){api(view==='feed'?'/posts/feed/':'/posts/').then(d=>setPosts(d.results||d)).catch(e=>setError(e.message))}},[user,view])
 function auth(data){localStorage.setItem('ebac_token',data.token);setToken(data.token);setUser(data.user)}
 function logout(){localStorage.removeItem('ebac_token');setToken(null);setUser(null)}
 if(!token)return <Auth onAuth={auth}/>
 if(!user)return <div className="loading"><Feather/><span>Carregando sua comunidade…</span></div>
 function updatePost(updated){setPosts(p=>p.map(x=>x.id===updated.id?updated:x))}
 const placeholder={notifications:['Notificações','Suas interações aparecerão aqui.'],bookmarks:['Itens salvos','Guarde publicações para ler depois.'],settings:['Configurações','Edite seus dados na página de perfil.']}
 return <div className="app-shell"><Sidebar view={view} setView={setView} user={user} onLogout={logout}/><main className="timeline">{['feed','explore'].includes(view)&&<><header className="page-header"><h2>{view==='feed'?'Início':'Explorar'}</h2><span className="spark">✦</span></header>{view==='feed'&&<Composer user={user} onCreated={p=>setPosts(x=>[p,...x])}/>} {error&&<p className="error padded">{error}</p>}<div className="feed-tabs"><button className="active">Para você</button><button onClick={()=>setView('people')}>Seguindo</button></div>{posts.length?posts.map(p=><Post post={p} key={p.id} onChange={updatePost}/>):<div className="empty"><Feather/><h3>Seu feed está tranquilo</h3><p>Siga algumas pessoas para ver as publicações delas aqui.</p><button className="primary" onClick={()=>setView('people')}>Encontrar pessoas</button></div>}</>}{view==='people'&&<People user={user}/>} {view==='profile'&&<Profile user={user} onUpdate={setUser}/>} {placeholder[view]&&<div className="empty tall"><h2>{placeholder[view][0]}</h2><p>{placeholder[view][1]}</p>{view==='settings'&&<button className="primary" onClick={()=>setView('profile')}>Editar perfil</button>}</div>}</main><Rightbar user={user} setView={setView}/></div>
}
export default App
