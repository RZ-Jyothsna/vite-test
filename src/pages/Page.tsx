import FeaturedTechBubbles from "./TechBubbles";

export function Page() {
  return (
    <div className="dual-column-section container">
      <FeaturedTechBubbles
        backgroundImage={{ src: "/imgs/preview/TechBubblesImage.png", alt: "background" }}
        techImage={<img src="/imgs/preview/Technology.png" alt="placeholder" />}
        item={{ props: { techBubbleBackgroundImage: null, techBubbles: null } }}
        techBubbles={[
          { props: { id: "tech-bubble-react-js", title: "React Js", description: "A javascript library for building user Interfaces", image: null, xCoordinate: "90", yCoordinate: "90" } },
          { props: { id: "tech-bubble-react-native", title: "ReactNative", description: "A best-in-class JavaScript library for building user interfaces", image: null, xCoordinate: "20", yCoordinate: "30" } }
        ]}
      />
    </div>
  )
}

export default Page;
