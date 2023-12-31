import React, { useState, useEffect, useCallback } from "react";
import { Youtubevideo } from "../../models/youtubeVideo";
import { useFormik } from "formik";
import * as yup from "yup";
import { useSnackbar } from "notistack";
import { MemoizedImgPreview } from "../../components/ImgPreview";
import {
  getYoutubeVideos,
  saveYoutubeVideo,
  deleteYoutubeVideo,
} from "../../services/youtubeVideos";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import "./YoutubeDisplayer.css";

const YoutubeDisplayer: React.FC = () => {
  const axiosPrivate = useAxiosPrivate();
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik({
    initialValues: {
      youtubeUrl: "",
    },
    validationSchema: yup.object({
      youtubeUrl: yup
        .string()
        .url("Must be a valid URL, Example (https://youtube.com)")
        .required("URL is required "),
    }),
    onSubmit: (values, { resetForm }) => {
      const { youtubeId, isValidated } = validateUrl(values.youtubeUrl);
      if (isValidated) onSaveYoutubeVideoClicked(youtubeId);
      resetForm();
    },
  });

  const [youtubeVideos, setYoutubeVideos] = useState<Youtubevideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchFlag, setRefetchFlag] = useState(false);

  const onSaveYoutubeVideoClicked = async (youtubeId: string | null) => {
    setIsLoading(true);
    try {
      const data = await saveYoutubeVideo(youtubeId, axiosPrivate);
      setYoutubeVideos([...youtubeVideos, data]);
      enqueueSnackbar("Video Agregado Correctamente", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(`${error}`, {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
      setRefetchFlag(true);
    }
  };

  const onDeleteYoutubeVideo = async (id: string) => {
    setIsLoading(true);
    try {
      deleteYoutubeVideo(id, axiosPrivate);
      setYoutubeVideos([...youtubeVideos]);
      enqueueSnackbar("Video Eliminado Correctamente", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(`${error}`, {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
      setRefetchFlag(true);
    }
  };

  const fetchYoutubeVideoData = useCallback(async () => {
    const data = await getYoutubeVideos(axiosPrivate);
    setYoutubeVideos(data);
  }, [axiosPrivate]);

  useEffect(() => {
    fetchYoutubeVideoData();
  }, [fetchYoutubeVideoData]);

  useEffect(() => {
    if (refetchFlag) {
      fetchYoutubeVideoData();
      setRefetchFlag(false);
    }
  }, [refetchFlag, fetchYoutubeVideoData]);

  const validateUrl = (youtubeUrl: string) => {
    if (!youtubeUrl) return { youtubeId: "", isValidated: false };

    let youtubeId: string | null = "";
    const url = new URL(youtubeUrl);

    if (url.host.trim().toLowerCase() === "youtu.be") {
      youtubeId = url.pathname.slice(1);
    }

    if (url.host.trim().toLowerCase() === "www.youtube.com") {
      youtubeId = url.searchParams.get("v");
    }

    return {
      youtubeId,
      isValidated: true,
    };
  };

  return (
    <>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="container">
          <div className="form-container">
            <div className="form-container-title">
              <h1>Añadir nuevo video</h1>
            </div>
            <div className="form-container-form">
              <form onSubmit={formik.handleSubmit}>
                <div className="text">
                  <div className="input">
                    <input
                      type="text"
                      placeholder="Youtube URL"
                      id="youtubeUrl"
                      name="youtubeUrl"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.youtubeUrl}
                    ></input>
                  </div>
                  <button type="submit" className="submit">
                    Añadir
                  </button>
                </div>
                {formik.touched.youtubeUrl && formik.errors.youtubeUrl && (
                  <div className="formik-error">{formik.errors.youtubeUrl}</div>
                )}
              </form>
            </div>
          </div>
          <MemoizedImgPreview
            youtubeVideos={youtubeVideos}
            onDeleteYoutubeVideo={onDeleteYoutubeVideo}
          />
        </div>
      )}
    </>
  );
};

export default YoutubeDisplayer;
