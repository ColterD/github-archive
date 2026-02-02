import { BrowserRouter as Router, Link, Route, Switch} from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Circle from './Circle';
import Discord from'./Discord';
import History from './History';
import Year14 from './history/Year14/Year14';
import AssaultonKorosSpaceworks from './history/Year14/AssaultonKorosSpaceworks';
import TheMercenaryGuildandSabotage from './history/Year14/TheMercenaryGuildandSabotage';
import TheOctagonLeagueTakeover from './history/Year15/TheOctagonLeagueTakeover';
import KuatSystemsEngineeringSabotages from './history/Year15//KuatSystemsEngineeringSabotage';
import AssassinationOfAndyLongshot from './history/Year15/AssassinationOfAndyLongshot';
import TerroristsInCoruscant from './history/Year15/TerroristsInCoruscant';
import BlackSailsPrison from './history/Year15/BlackSailsPrison';
import ZannConsortiumRetaliation from './history/Year16/ZannConsortiumRetaliation';
import CrossingtheSun from './history/Year16/CrossingtheSun';
import TaxingtheRebels from './history/Year16/TaxingtheRebels';
import BactaThieves from './history/Year17/BactaThieves';
import TriumvirateCoalitionsFallenKing from './history/Year17/TriumvirateCoalitionsFallenKing';
import ProfessionalExporters from './history/Year17/ProfessionalExporters';
import TheLastoftheJixSiblings from './history/Year17/TheLastoftheJixSiblings';
import GetJawa from './history/Year17/GetJawa';
import StandOff from './history/Year17/StandOff';
import Consequences from './history/Year17/Consequences';
import Interference from './history/Year17/Interference';
import AssetsAreWeakness from './history/Year18/AssetsAreWeakness';
import OneRogueDown from './history/Year18/OneRogueDown';
import DullingtheEdge from './history/Year18/DullingtheEdge';
import CrimsonoverGlomTho from './history/Year18/CrimsonoverGlomTho';
import ChissConflict from './history/Year18/ChissConflict';
import BackWithAVengeance from './history/Year19/BackWithAVengeance';
import NonProCeteraImpius from './history/Year19/NonProCeteraImpius';
import Year15 from './history/Year15/Year15';
import Year16 from './history/Year16/Year16';
import Year17 from './history/Year17/Year17';
import Year18 from './history/Year18/Year18';
import Year19 from './history/Year19/Year19';
import Year20 from './history/Year20/Year20';
import PlayingWithFire from './history/Year20/PlayingWithFire';
import Year21 from './history/Year21/Year21';
import Year22 from './history/Year22/Year22';
import DistributionofJustice from './history/Year22/DistributionofJustice';
import UndertheChaosStar from './history/Year21/UndertheChaosStar';
import TerrorfromAbove from './history/Year22/TerrorfromAbove';
import RedDawnofGazaan from './history/Year22/RedDawnofGazaan';
import LastHolocall from './history/Year22/LastHolocall';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route path="/circle">
              <Circle />
            </Route>
            <Route exact path="/history">
              <History />
            </Route>
            <Route exact path="/history/Year14">
              <Year14 />
            </Route>
            <Route exact path="/history/Year14/AssaultonKorosSpaceworks">
              <AssaultonKorosSpaceworks />
            </Route>
            <Route exact path="/history/Year14/TheMercenaryGuildandSabotage">
              <TheMercenaryGuildandSabotage />
            </Route>
            <Route exact path="/history/Year15">
              <Year15 />
            </Route>
            <Route exact path="/history/Year15/TheOctagonLeagueTakeover">
              <TheOctagonLeagueTakeover />
            </Route>
            <Route exact path="/history/Year15/KuatSystemsEngineeringSabotage">
              <KuatSystemsEngineeringSabotages />
            </Route>
            <Route exact path="/history/Year15/AssassinationOfAndyLongshot">
              <AssassinationOfAndyLongshot />
            </Route>
            <Route exact path="/history/Year15/TerroristsInCoruscant">
              <TerroristsInCoruscant />
            </Route>
            <Route exact path="/history/Year15/BlackSailsPrison">
              <BlackSailsPrison />
            </Route>
            <Route exact path="/history/Year16">
              <Year16 />
            </Route>
            <Route exact path="/history/Year16/ZannConsortiumRetaliation">
              <ZannConsortiumRetaliation />
            </Route>
            <Route exact path="/history/Year16/CrossingtheSun">
              <CrossingtheSun />
            </Route>
            <Route exact path="/history/Year16/TaxingtheRebels">
              <TaxingtheRebels />
            </Route>
            <Route exact path="/history/Year17">
              <Year17 />
            </Route>
            <Route exact path="/history/Year17/BactaThieves">
              <BactaThieves />
            </Route>
            <Route exact path="/history/Year17/TriumvirateCoalitionsFallenKing">
              <TriumvirateCoalitionsFallenKing />
            </Route>
            <Route exact path="/history/Year17/ProfessionalExporters">
              <ProfessionalExporters />
            </Route>
            <Route exact path="/history/Year17/TheLastoftheJixSiblings">
              <TheLastoftheJixSiblings />
            </Route>
            <Route exact path="/history/Year17/GetJawa">
              <GetJawa />
            </Route>
            <Route exact path="/history/Year17/StandOff">
              <StandOff />
            </Route>
            <Route exact path="/history/Year17/Consequences">
              <Consequences />
            </Route>
            <Route exact path="/history/Year17/Interference">
              <Interference />
            </Route>
            <Route exact path="/history/Year18">
              <Year18 />
            </Route>
            <Route exact path="/history/Year18/AssetsAreWeakness">
              <AssetsAreWeakness />
            </Route>
            <Route exact path="/history/Year18/OneRogueDown">
              <OneRogueDown />
            </Route>
            <Route exact path="/history/Year18/DullingtheEdge">
              <DullingtheEdge />
            </Route>
            <Route exact path="/history/Year18/CrimsonoverGlomTho">
              <CrimsonoverGlomTho />
            </Route>
            <Route exact path="/history/Year18/ChissConflict">
              <ChissConflict />
            </Route>
            <Route exact path="/history/Year19">
              <Year19 />
            </Route>
            <Route exact path="/history/Year19/BackWithAVengeance">
              <BackWithAVengeance />
            </Route>
            <Route exact path="/history/Year19/NonProCeteraImpius">
              <NonProCeteraImpius />
            </Route>
            <Route exact path="/history/Year20">
              <Year20 />
            </Route>
            <Route exact path="/history/Year20/PlayingWithFire">
              <PlayingWithFire />
            </Route>
            <Route exact path="/history/Year21">
              <Year21 />
            </Route>
            <Route exact path="/history/Year22">
              <Year22 />
            </Route>
            <Route exact path="/history/Year22/DistributionofJustice">
              <DistributionofJustice />
            </Route>
            <Route exact path="/history/Year22/UndertheChaosStar">
              <UndertheChaosStar />
            </Route>
            <Route exact path="/history/Year22/TerrorfromAbove">
              <TerrorfromAbove />
            </Route>
            <Route exact path="/history/Year22/RedDawnofGazaan">
              <RedDawnofGazaan />
            </Route>
            <Route exact path="/discord">
              <Discord />
            </Route>
            <Route exact path="/history/Year22/LastHolocall">
              <LastHolocall />
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;
