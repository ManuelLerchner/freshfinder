import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/SupabaseClient";
import CookingStep from "../components/CookingStep";
import DepenencyGraph, { convertToTree } from "../components/DepenencyGraph";

export default function Cooking() {
  const { recipeID } = useParams();

  const [finishedSteps, setFinishedSteps] = useState<number[]>([]);
  const [myStep, setMyStep] = useState<number>(0);

  const [recipe, setRecipe] = useState<{
    name: string;
    Steps: string[];
    DependencyGraph: { Dependency: number[][] };
    recipeImages: { images: string[] };
  }>();

  useEffect(() => {
    const queryFunction = async () => {
      const { data, error } = await supabase
        .from("Recipes")
        .select("*")
        .eq("id", recipeID);

      setRecipe((data as any)[0]);
    };

    queryFunction();
  }, []);

  function adaptClientData(payload: any) {
    // Adapt the client data here
  }

  function startSynchronisation() {
    const channel = supabase.channel(sessionID);
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        return null;
      }
      channel.send({
        type: "broadcast",
        event: "updateSteps",
        payload: { recipeID: recipeID },
      });
    });
  }

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  const sessionID = getRandomInt(100).toString();

  useEffect(() => {
    const channel = supabase.channel(sessionID);
    // Add a listener until someone joins the session
    channel
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        startSynchronisation();
      })
      .subscribe();
  }, []);

  return (
    <>
      <div className="h-full flex flex-col items-center my-4">
        <h1 className="text-2xl font-bold">
          Start Cooking - SessionID: {sessionID}
        </h1>

        <div className="h-full flex flex-col items-center justify-center my-2">
          {recipe && (
            <>
              <CookingStep
                step_number={myStep}
                description={recipe.Steps[myStep]}
                url={
                  recipe.recipeImages.images[
                    (myStep + 1) % recipe.recipeImages.images.length
                  ]
                }
                onFinished={() => {
                  setFinishedSteps([...finishedSteps, myStep]);
                  setMyStep(myStep + 1);
                }}
                buttonDisabled={myStep == recipe.recipeImages.images.length - 1}
                buttonText={
                  myStep == recipe.recipeImages.images.length - 1
                    ? "Finished!"
                    : "Next Step"
                }
              />

              <DepenencyGraph
                tree={convertToTree(recipe.DependencyGraph.Dependency)}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
