import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PowerChainLogo } from "../brand";
import { useAccount } from "../../features/account";
import { useSolanaWallet } from "../../integrations/solana";
import { usePowerChainTheme } from "../../theme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { LAYOUT } from "../../constants/layout";
import { APP_ROUTES, PRIMARY_TABS } from "../../constants/routes";

export function ResponsiveHeader() {
  const pathname = usePathname();
  const { account } = useAccount();
  const wallet = useSolanaWallet();
  const { theme } = usePowerChainTheme();
  const { isMobile, isTablet } = useResponsiveLayout();
  if (isMobile) return null;
  const height = isTablet ? LAYOUT.tabletHeaderHeight : LAYOUT.desktopHeaderHeight;

  return (
    <View style={[styles.shell,{minHeight:height,backgroundColor:theme.colors.surface,borderBottomColor:theme.colors.border}]}> 
      <View style={[styles.inner,{maxWidth:LAYOUT.desktopMaxWidth,paddingHorizontal:isTablet?LAYOUT.tabletGutter:LAYOUT.desktopGutter}]}> 
        <Pressable accessibilityRole="button" accessibilityLabel="PowerChain Overview" onPress={()=>router.push(APP_ROUTES.overview as never)} style={({pressed})=>[styles.brand,{opacity:pressed ? 0.72 : 1}]}> 
          <View style={[styles.logoChip,{backgroundColor:theme.colors.surfaceSubtle}]}><PowerChainLogo size={32} variant="green"/></View>
          <View style={styles.brandCopy}><Text numberOfLines={1} style={[styles.brandTitle,{color:theme.colors.text}]}>PowerChain</Text>{!isTablet?<Text numberOfLines={1} style={[styles.brandMeta,{color:theme.colors.textMuted}]}>Copilot · Operations</Text>:null}</View>
        </Pressable>

        <View style={styles.nav}>
          {PRIMARY_TABS.map((item)=>{
            const active = item.key === "index"
              ? pathname === "/" || pathname.endsWith("/(tabs)")
              : pathname.includes(item.key === "action-center" ? "/action-center" : item.key === "integrations" ? "/integrations" : `/${item.key}`);
            return <Pressable key={item.key} accessibilityRole="button" accessibilityState={{selected:active}} onPress={()=>router.push(item.href as never)} style={({pressed})=>[styles.navItem,{backgroundColor:active?theme.colors.surfaceSubtle:"transparent",opacity:pressed ? 0.72 : 1}]}>
              <MaterialCommunityIcons name={item.icon} size={19} color={active?theme.colors.primary:theme.colors.textMuted}/>
              <Text numberOfLines={1} style={[styles.navLabel,{color:active?theme.colors.text:theme.colors.textMuted}]}>{item.label}</Text>
            </Pressable>;
          })}
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open PWRC Credits" onPress={()=>router.push(APP_ROUTES.credits as never)} style={({pressed})=>[styles.iconAction,{borderColor:theme.colors.border,backgroundColor:theme.colors.surfaceSubtle,opacity:pressed ? 0.72 : 1}]}>
            <MaterialCommunityIcons name="cash-multiple" size={19} color={theme.colors.primary}/>
          </Pressable>
          <View style={[styles.status,{borderColor:theme.colors.border,backgroundColor:theme.colors.surfaceSubtle}]}><View style={[styles.statusDot,{backgroundColor:wallet.account?theme.colors.success:theme.colors.textMuted}]}/>{!isTablet?<Text numberOfLines={1} style={[styles.statusText,{color:theme.colors.textMuted}]}>{wallet.account?"Wallet connected":"Wallet"}</Text>:null}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={()=>router.push(APP_ROUTES.settings as never)} style={({pressed})=>[styles.account,{backgroundColor:theme.colors.primary,opacity:pressed ? 0.78 : 1}]}><Text style={styles.accountText}>{(account?.displayName?.trim()?.[0]??"P").toUpperCase()}</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles=StyleSheet.create({
 shell:{width:"100%",borderBottomWidth:StyleSheet.hairlineWidth},
 inner:{width:"100%",minWidth:0,minHeight:"100%",alignSelf:"center",flexDirection:"row",alignItems:"center",gap:16},
 brand:{minWidth:0,flexDirection:"row",alignItems:"center",gap:9},logoChip:{width:40,height:40,borderRadius:10,alignItems:"center",justifyContent:"center"},brandCopy:{minWidth:0},brandTitle:{fontSize:14,lineHeight:18,fontWeight:"700"},brandMeta:{marginTop:1,fontSize:10,lineHeight:13},
 nav:{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:4},navItem:{minHeight:40,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,paddingHorizontal:10,borderRadius:10},navLabel:{fontSize:12,lineHeight:16,fontWeight:"600"},
 actions:{flexDirection:"row",alignItems:"center",gap:8},iconAction:{width:36,height:36,borderRadius:10,borderWidth:StyleSheet.hairlineWidth,alignItems:"center",justifyContent:"center"},status:{minHeight:36,flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:9,borderWidth:StyleSheet.hairlineWidth,borderRadius:10},statusDot:{width:7,height:7,borderRadius:4},statusText:{fontSize:11,lineHeight:15,fontWeight:"600"},account:{width:36,height:36,alignItems:"center",justifyContent:"center",borderRadius:10},accountText:{color:"#FFFFFF",fontSize:13,lineHeight:17,fontWeight:"700"}
});
