import { Link } from 'react-router-dom';
const History = () => {
    return ( 
            <div className="History">
                <h2 className="title">The History of Zann</h2>
                <div className="hlinks">
                    <h3 className="hyear"><Link to="/history/Year14">Year 14</Link></h3>
                        <h4><Link to="/history/Year14/AssaultonKorosSpaceworks">Assault on Koros Spaceworks</Link></h4>
                        <h4><Link to="/history/Year14/TheMercenaryGuildandSabotage">The Mercenary Guild and Sabotage</Link></h4>
                    <h3 className="hyear"><Link to="/history/Year15">Year 15</Link></h3>
                        <h4><Link to="/history/Year15/TheOctagonLeagueTakeover">The Octagon League Takeover</Link></h4>
                        <h4><Link to="/history/Year15/KuatSystemsEngineeringSabotage">Kuat Systems Engineering Sabotage</Link></h4>
                        <h4><Link to="/history/Year15/AssassinationOfAndyLongshot">Assassination of Andy Longshot</Link></h4>
                        <h4><Link to="/history/Year15/TerroristsInCoruscant">Terrorists in Coruscant</Link></h4>
                        <h4><Link to="/history/Year15/BlackSailsPrison">Black Sails Prison</Link></h4>
                    <h3 className="hyear"><Link to="/history/Year16">Year 16</Link></h3>
                        <h4><Link to="/history/Year16/ZannConsortiumRetaliation">Zann Consortium Retaliation</Link></h4>
                        <h4><Link to="/history/Year16/CrossingtheSun">Crossing the Sun</Link></h4>
                        <h4><Link to="/history/Year16/TaxingtheRebels">Taxing the Rebels</Link></h4>
                    <h3 className="hyear"><Link to="/history/Year17">Year 17</Link></h3>
                        <h4><Link to="/history/Year17/BactaThieves">Bacta Thieves</Link></h4>
                        <h4><Link to="/history/Year17/TriumvirateCoalitionsFallenKing">Triumvirate Coalition's Fallen King</Link></h4>
                        <h4><Link to="/history/Year17/ProfessionalExporters">Professional Exporters</Link></h4>
                        <h4><Link to="/history/Year17/TheLastoftheJixSiblings">The Last of the Jix Siblings</Link></h4>
                        <h4><Link to="/history/Year17/GetJawa">Get Jawa</Link></h4>
                        <h4><Link to="/history/Year17/StandOff">Stand Off</Link></h4>
                        <h4><Link to ="/history/Year17/Consequences">Consequences</Link></h4>
                        <h4><Link to="/history/Year17/Interference">Interference</Link></h4>
                    <h3 className="hyear"><Link to="/history/Year18">Year 18</Link></h3>
                        <h4><Link to="/history/Year18/AssetsAreWeakness">Assets Are Weakness</Link></h4>
                        <h4><Link to="/history/Year18/OneRogueDown">One Rogue Down</Link></h4>
                        <h4><Link to="/history/Year18/DullingtheEdge">Dulling the Edge</Link></h4>
                        <h4><Link to="/history/Year18/CrimsonoverGlomTho">Crimson over Glom Tho</Link></h4>
                        <h4><Link to="/history/Year18/ChissConflict">Chiss Conflict</Link></h4>
                    <h3 className="hyear"><Link to="/history/Year19">Year 19</Link></h3>
                        <h4><Link to="/history/Year19/BackWithAVengeance">Back With A Vengeance</Link></h4>
                        <h4><Link to="/history/Year19/NonProCeteraImpius">Non Pro Cetera Impius</Link></h4>
                    <h3 className="hyear"><Link to="/history/Year20">Year 20</Link></h3>
                        <h4><Link to="/history/Year20/PlayingWithFire">Playing with Fire</Link></h4>
                    <h3 className='hyear'><Link to="/history/Year21">Year 21</Link></h3>
                    <h4><Link to="/history/Year22/UndertheChaosStar">Under the Chaos Star</Link></h4>
                    <h3 className='hyear'><Link to="/history/Year22">Year 22</Link></h3>
                        <h4><Link to="/history/Year22/DistributionofJustice">Distribution of Justice</Link></h4>
                        <h4><Link to="/history/Year22/TerrorfromAbove">Terror from Above</Link></h4>
                        <h4><Link to="/history/Year22/RedDawnofGazaan">Red Dawn of Gazaan</Link></h4>
                        <h4><Link to="/history/Year22/LastHolocall">Last Holocall</Link></h4>
                </div>
            </div> 
     );
}
 
export default History;