#include <sourcemod>
#include <cstrike>
#include <sdktools>
#include <SteamWorks>
#include <SWGM>

#pragma semicolon 1
// #pragma newdecls required

#define MESSAGE_PREFIX "[not2easy]"

Handle RoundStartMoney;
Handle g_hElSayisi;

int iRoundStartMoney;

public Plugin myinfo = 
{
	name = "Round start money",
	author = "B3none, LazHoroni",
	description = "",
	version = "1.0.0",
	url = ""
};

public void OnPluginStart()
{
	HookEvent("round_start", OnRoundStart);

	RoundStartMoney = CreateConVar("sm_roundbasi_para", "650", "Round start money");
	g_hElSayisi = CreateConVar("sm_para_elsayisi", "3", "Kaçıncı elde sistem açılsın?");
	
	AutoExecConfig(true, "swgm_grup_parasi");
}

public void OnMapStart()
{
	iRoundStartMoney = GetConVarInt(RoundStartMoney);
}

public Action OnRoundStart(Handle hEvent, const char[] Name, bool dontbroadcast)
{
	if (IsWarmup())
	{
		return;
	}
	
	int iElSayisi = GetConVarInt(g_hElSayisi);
	
	if(((GetTeamScore(2) + GetTeamScore(3)) >= iElSayisi && ((GetTeamScore(2) + GetTeamScore(3)) % 15 != 0) && ((GetTeamScore(2) + GetTeamScore(3)) % 15 != 1)))
	{
		for (int iClient = 1; iClient <= MaxClients; iClient++)
		{
			if(IsClientInGame(iClient))
			{
				if(!SWGM_IsPlayerValidated(iClient) && SWGM_InGroup(iClient))
				{
					PrintToChat(iClient, "%s \x04Gruba katıldığınız için \x07+$%i \x04kazandınız.", MESSAGE_PREFIX, iRoundStartMoney);
					int money = GetEntProp(iClient, Prop_Send, "m_iAccount");
					SetEntProp(iClient, Prop_Send, "m_iAccount", money + iRoundStartMoney);
					SetEntProp(iClient, Prop_Send, "m_bHasHelmet", 100);
					SetEntProp(iClient, Prop_Send, "m_ArmorValue", 100);
					money = money + iRoundStartMoney;
					if (money > 16000)
					{
						money = 16000;
					}
				}
				else
				{
					PrintToChat(iClient, "%s \x04Gruba katılarak \x07+$%i \x04kazabilirsiniz.", MESSAGE_PREFIX, iRoundStartMoney);
					PrintToChat(iClient, "%s \x04Skor tablosundaki \x07SUNUCU İNTERNET SİTESİ\x04 butonuna tıklayarak gruba katılabilirsiniz.", MESSAGE_PREFIX);
				}
			}
		}
	}
	else
	{
		for (int iClient = 1; iClient <= MaxClients; iClient++)
		{
			if(IsClientInGame(iClient))
			{
				if(!SWGM_IsPlayerValidated(iClient) && SWGM_InGroup(iClient))
				{
					PrintToChat(iClient, "%s \x04İlk 3 round \x07+$%i, zırh, kask \x04ödülü devre dışıdır.", MESSAGE_PREFIX, iRoundStartMoney);
				}
				else
				{
					PrintToChat(iClient, "%s \x04Gruba katılarak \x07+$%i \x04kazabilirsiniz.", MESSAGE_PREFIX, iRoundStartMoney);
					PrintToChat(iClient, "%s \x04Skor tablosundaki \x07SUNUCU İNTERNET SİTESİ\x04 butonuna tıklayarak gruba katılabilirsiniz.", MESSAGE_PREFIX);
				}
			}
		}
	}		
}

bool IsWarmup()
{
	return GameRules_GetProp("m_bWarmupPeriod") != 0;
}