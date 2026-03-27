import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from api.models import Product
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

def recommend_product(product_id):
   
    products = Product.objects.all()

    
    data = {
        'product_id': [product.id for product in products],
        'name': [product.name for product in products],
        'description': [product.description for product in products]
    }

    df = pd.DataFrame(data)

    # Combine name and description into one column for TF-IDF vectorization
    df['combined'] = df['name'] + " " + df['description']

    # Use TF-IDF Vectorizer to convert text data to numerical format
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined'])

    # Compute cosine similarity
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Get index of the product
    idx = df.index[df['product_id'] == product_id].tolist()[0]

    # Get similarity scores for the product
    sim_scores = list(enumerate(cosine_sim[idx]))

    # Sort the products based on similarity scores
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    # Get the top 3 most similar products
    sim_scores = sim_scores[1:4]  # Skip the first one as it's the same product

    # Get product indices
    product_indices = [i[0] for i in sim_scores]

    # Return the top 3 similar products
    return df['product_id'].iloc[product_indices].tolist()



def train_price_prediction_model():
    # Fetch data from the Product model (replace with actual database query)
    products = Product.objects.all()

    data = {
        'product_id': [product.id for product in products],
        'name': [product.name for product in products],
        'description': [product.description for product in products],
        'category': [product.category.name for product in products],  # Assuming category is a ForeignKey
        'stock_quantity': [product.stock_quantity for product in products],
        'price': [product.price for product in products]
    }

    df = pd.DataFrame(data)

    # Feature engineering: Combining name, description, and category
    df['combined'] = df['name'] + " " + df['description'] + " " + df['category']

    # Use TF-IDF Vectorizer to convert text data to numerical format
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined'])

    # Target variable: Price
    X = tfidf_matrix
    y = df['price']

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train the Linear Regression model
    model = LinearRegression()
    model.fit(X_train, y_train)

    # Predict on the test set
    y_pred = model.predict(X_test)

    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    print(f"Mean Squared Error: {mse}")

    return model, tfidf

def predict_price(model, tfidf, description, category, stock_quantity):
    # Prepare the input features
    combined_input = description + " " + category

    # Convert the input to the same format as training data
    tfidf_input = tfidf.transform([combined_input])

    # Predict the price using the trained model
    predicted_price = model.predict(tfidf_input)

    return predicted_price[0]