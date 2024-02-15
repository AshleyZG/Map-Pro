from sklearn.cluster import KMeans
import numpy as np
from sklearn.manifold import TSNE

def get_code_position(n_clusters, df):

    new_df = df.copy()

    matrix = np.vstack(df.embeddings.values)

    kmeans = KMeans(n_clusters=n_clusters, init="k-means++", random_state=42)
    kmeans.fit(matrix)
    labels = kmeans.labels_
    new_df["cluster"] = labels

    tsne = TSNE(n_components=2, perplexity=15, random_state=42, init="random", learning_rate=200)
    vis_dims2 = tsne.fit_transform(matrix)

    x = [x for x, y in vis_dims2]
    y = [y for x, y in vis_dims2]

    new_df['x'] = x
    new_df['y'] = y

    return new_df