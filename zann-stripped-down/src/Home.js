import Defiler from './Images/defiler.png';
import Zann from './Images/zannlogo.png';
function Home() {
    return (
        <div className="home">
            <h2 className="title">Homepage</h2>
            <text>
                Across the harsh desert surface planets, ice worlds, and jungle landscapes of the galaxy,
                stretched to remote outposts, are individuals labeled by some as armored and veiled pirates, and others across the galaxy as terrorists.<br /><br />
                Men and women of all races and background shrouded in mystery, known for their brutality, subterfuge, and subversive tactics are lead by their Krestviniic (Lord). Spreading their corruption throughout every habitable region of space, attacking the very core of civilization in its vast cities ,
                remote colonies, and outposts, the crime syndicate known as Zann Consortium engulfs everything with it's corruptive influence.
            </text>
            <img src={Defiler} className="homepageimage" alt="defiler" />
            <text>
                Elite highly trained agents that spread the corruption are known as "Defilers" . Taught to endure all types of environment and learn the weaknesses of all their enemies, the few that are seen are observed wearing unique red battle armor and minacious red helmets.
                The armor, a signature of the Defiler,  serves as both a symbol and the mark of an agent of the organization.<br /><br />
                All tactical operations are overseen by the Defilers Circle which manage the syndicate's vast cell networks; always furthering its agenda through the  use of covert operations specializing in assassinations,
                blackmailing, demoralization, espionage, guerilla warfare, kidnapping, sabotage, and piracy to achieve their goals.
            </text>
            <img src={Zann} className="homepageimage" alt="zannlogo" />
        </div>
    );
}
 
export default Home;