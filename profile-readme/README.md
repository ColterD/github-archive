<!-- Profile README for GitHub: ColterD -->

<h1 align="center">Hi, I’m Colter 👋</h1>
<h3 align="center">Windows Systems Engineer</h3>
<h3 align="center">Hyper‑V (Clusters & VMM) • Active Directory/GPO • Windows Server Infrastructure</h3>

<p align="center">
  I build and run dependable Windows platforms. My sweet spot is <b>Hyper‑V</b> from administration → engineering (clusters, VMM, migrations,
  host drain/maintenance, capacity & failover testing, post‑migration stabilization) alongside identity hardening
  (<b>Kerberos AES‑only</b>, <b>NTLM</b> reduction, <b>AD CS</b> hygiene) and crisp change control. I automate with <b>PowerShell</b>,
  drive patch/vuln ops (<b>SCCM/WSUS</b>, <b>Tenable</b>), and keep a pulse on auth telemetry (<b>Splunk</b> / Windows Eventing).
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/colter-dahlberg" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-Colter%20Dahlberg-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="mailto:colterdahlberg@gmail.com"><img src="https://img.shields.io/badge/Email-colterdahlberg%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="#projects"><img src="https://img.shields.io/badge/Projects-See%20below-6aa84f?style=for-the-badge" alt="Projects"/></a>
  <a href="#resume"><img src="https://img.shields.io/badge/Resume-ATS%20%26%20CV-4b7bec?style=for-the-badge" alt="Resume"/></a>
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=colterd&label=Profile%20Views&color=0e75b6&style=flat-square" alt="Profile views"/>
</p>

---

## 🧭 About
- **Experience:** 12+ years across healthcare, federal, and enterprise environments  
- **Core:** Windows **System Administration**, **Hyper‑V** (clusters & VMM), **Active Directory/GPO**, **Kerberos/NTLM** hardening, **AD CS**  
- **Ops:** **SCCM/WSUS** automation, **Tenable** remediation, **Splunk** dashboards, IR/DR runbooks, on‑call rotations  
- **Tooling:** **PowerShell**, Wireshark/PerfMon, Azure IaaS, DSC/LAPS  
- **Philosophy:** make change safe & boring → document the runbook, measure, validate rollback

## 🔭 Current Focus
- Post‑migration **Hyper‑V** stabilization (host drain/placement, capacity planning, failover testing)  
- Identity hardening (Kerberos AES‑only, NTLM reduction, LDAP/SMB signing readiness)  
- Patch/vuln ops at scale with measurable SLAs (SCCM/WSUS, Tenable)  

## 🧰 Languages & Tools
<p align="left">
  <img src="https://img.shields.io/badge/Windows%20Server-0078D4?style=for-the-badge&logo=microsoft&logoColor=white" alt="Windows Server"/>
  <img src="https://img.shields.io/badge/PowerShell-5391FE?style=for-the-badge&logo=powershell&logoColor=white" alt="PowerShell"/>
  <img src="https://img.shields.io/badge/Active%20Directory-0078D4?style=for-the-badge&logo=microsoft&logoColor=white" alt="Active Directory"/>
  <img src="https://img.shields.io/badge/Hyper--V-0078D4?style=for-the-badge&logo=microsoft&logoColor=white" alt="Hyper‑V"/>
  <img src="https://img.shields.io/badge/SCCM%2FWSUS-0078D4?style=for-the-badge&logo=microsoft&logoColor=white" alt="SCCM/WSUS"/>
  <img src="https://img.shields.io/badge/Tenable-0052CC?style=for-the-badge&logo=tenable&logoColor=white" alt="Tenable"/>
  <img src="https://img.shields.io/badge/Splunk-000000?style=for-the-badge&logo=splunk&logoColor=white" alt="Splunk"/>
  <img src="https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" alt="Azure"/>
  <img src="https://img.shields.io/badge/Wireshark-1679A7?style=for-the-badge&logo=wireshark&logoColor=white" alt="Wireshark"/>
  <img src="https://img.shields.io/badge/PerfMon-5E5E5E?style=for-the-badge" alt="Performance Monitor"/>
  <img src="https://img.shields.io/badge/DSC-5E5E5E?style=for-the-badge" alt="DSC"/>
  <img src="https://img.shields.io/badge/LAPS-5E5E5E?style=for-the-badge" alt="LAPS"/>
</p>

> I also tinker with Proxmox/LXC and Docker in my lab—see projects below.

---

## 🚀 What I Do
- Operate **Hyper‑V clusters** end‑to‑end: host drain/patch, capacity planning, **failover testing**, post‑migration stabilization  
- Administer **AD/GPO**, perform **DC upgrades**, clean up **SPN** issues, and improve **AD CS** hygiene  
- Reduce legacy auth by auditing **NTLM** usage and enforcing stronger **Kerberos** policies (AES‑only, PAC signatures/armoring)  
- Automate **patching** and reporting with **PowerShell** + **SCCM/WSUS**; track risk with **Tenable**  
- Build **Splunk** searches/dashboards for auth pathways, failed logons, and ticket anomalies  

---

## 📦 Projects <a id="projects"></a>
- **meowcoin-docker** — Docker Compose setup with health checks and helper scripts for a Meowcoin node.  
  <sub>`Docker` · `Compose` · `healthcheck` · `bash`</sub>  
  https://github.com/ColterD/meowcoin-docker

- **profilarr-lxc** — Proxmox LXC installer/maintenance scripts for Profilarr.  
  <sub>`Proxmox` · `LXC` · `shell` · `automation`</sub>  
  https://github.com/ColterD/profilarr-lxc

- **COLTR** — Proxmox helpers for host/container lifecycle tasks.  
  <sub>`Proxmox` · `automation` · `maintenance` · `shell`</sub>  
  https://github.com/ColterD/COLTR

- **Chocolatey_Scripts** — Windows bootstrap scripts with Chocolatey packages.  
  <sub>`Windows` · `Chocolatey` · `automation`</sub>  
  https://github.com/ColterD/Chocolatey_Scripts

- **cf-workers-status-page** — Cloudflare Workers status page (fork/customization).  
  <sub>`Cloudflare Workers` · `uptime` · `KV` · `CRON`</sub>  
  https://github.com/ColterD/cf-workers-status-page

- **FiveM-Python-Setup** — Ubuntu + LinuxGSM installer; generates a service management script.  
  <sub>`Python` · `automation` · `MariaDB` · `LinuxGSM`</sub>  
  https://github.com/ColterD/FiveM-Python-Setup

---

## 📈 GitHub Stats
<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs?username=colterd&hide=html&layout=compact&card_width=400&theme=transparent" alt="Top Languages"/>
  <img src="https://github-readme-stats.vercel.app/api?username=colterd&show_icons=true&theme=transparent&rank_icon=github" alt="GitHub Stats"/>
</p>

---

## 🧾 Resume & CV <a id="resume"></a>
- **LinkedIn:** https://www.linkedin.com/in/colter-dahlberg  
- **CV:** https://rxresu.me/colterdahlberg/colter-dahlberg-cv-2025
- **Resume:** https://rxresu.me/colterdahlberg/colter-dahlberg-resume-2025

---

## ☕ Support
<p align="center">
  <a href="https://ko-fi.com/colterplus"><img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" height="45" alt="Buy Me a Coffee"/></a>
</p>

<p align="center"><sub>Thanks for stopping by! If any of my utilities or notes help you, feel free to open an issue or PR.</sub></p>

