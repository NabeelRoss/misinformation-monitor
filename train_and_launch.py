import pandas as pd
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import gradio as gr
from transformers import pipeline

print("--- 1. Loading and Preprocessing Data ---")
# Load data from the JSON file in the same folder
df = pd.read_json("csvjson.json")

# Map labels and filter out 'Uncertain' entries
df['label'] = df['Misinformation_Flag'].map({'True':1, 'False':0, 'Uncertain':-1})
df = df[df['label'] != -1]
df = df[['Content_Text', 'label']]
print(f"Data shape after filtering: {df.shape}")

# Split the dataset
train_texts, test_texts, train_labels, test_labels = train_test_split(
    df['Content_Text'].tolist(), df['label'].tolist(), test_size=0.2, random_state=42
)

print("\n--- 2. Tokenizing Data ---")
# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

# Create Hugging Face Datasets
train_ds = Dataset.from_dict({'text': train_texts, 'labels': train_labels})
test_ds = Dataset.from_dict({'text': test_texts, 'labels': test_labels})

# Tokenize the datasets
def tokenize(batch):
    return tokenizer(batch['text'], truncation=True, padding=True)

train_ds = train_ds.map(tokenize, batched=True)
test_ds = test_ds.map(tokenize, batched=True)

print("\n--- 3. Setting up Model and Trainer ---")
# Load the model
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

# Define training arguments
training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    num_train_epochs=2,
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    logging_dir="./logs",
    save_strategy="epoch"
)

# Create the Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=test_ds,
    tokenizer=tokenizer
)

print("\n--- 4. Starting Model Training ---")
# Train the model
trainer.train()

print("\n--- 5. Evaluating Model ---")
metrics = trainer.evaluate()
print(metrics)

print("\n--- 6. Saving Model and Tokenizer ---")
# Save the fine-tuned model and tokenizer locally
model.save_pretrained("misinfo-model")
tokenizer.save_pretrained("misinfo-model")

print("\n--- 7. Launching Gradio Interface ---")
# Create a pipeline with the saved local model
pipe = pipeline("text-classification", model="misinfo-model", tokenizer="misinfo-model")

def detect_misinformation(text):
    result = pipe(text)[0]
    label = result['label']
    score = result['score']
    verdict = "⚠️ Likely Misinformation" if label == 'LABEL_1' else "✅ Seems Genuine"
    return f"{verdict}\nConfidence: {score:.2f}"

demo = gr.Interface(
    fn=detect_misinformation,
    inputs=gr.Textbox(lines=3, placeholder="Paste a social media post..."),
    outputs="text",
    title="🧠 Social Media Misinformation Detector",
    description="A locally fine-tuned DistilBERT model to detect misinformation."
)

# Launch the web interface
demo.launch()